const express = require('express');
const { prisma } = require('../lib/clients');

const router = express.Router();

/**
 * GET /api/vfd-models
 * Get all active VFD models
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) || 10;
        const search = (req.query.search || req.query.query || '').trim();

        const where = { isActive: true };
        if (search) {
            where.OR = [
                { modelCode: { contains: search } },
                { modelName: { contains: search } },
                { manufacturer: { contains: search } },
            ];
        }

        const total = await prisma.vfdModel.count({ where });

        const findOptions = {
            where,
            orderBy: { modelName: 'asc' },
        };

        if (!isNaN(page) && page > 0) {
            findOptions.skip = (page - 1) * limit;
            findOptions.take = limit;
        }

        const vfdModels = await prisma.vfdModel.findMany(findOptions);

        // Fetch all telemetry configs from telemetry_configs table to auto-populate
        const allTelemetry = await prisma.telemetryConfig.findMany({
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        });
        const telemetryByModel = {};
        for (const t of allTelemetry) {
            if (!telemetryByModel[t.vfdModel]) telemetryByModel[t.vfdModel] = [];
            telemetryByModel[t.vfdModel].push(t);
        }

        res.json({
            success: true,
            total,
            page: !isNaN(page) ? page : 1,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            vfdModels: vfdModels.map(model => ({
                id: model.id,
                modelCode: model.modelCode,
                modelName: model.modelName,
                manufacturer: model.manufacturer,
                daddCommand: model.daddCommand,
                errorCodes: model.errorCodes,
                statusCodes: model.statusCodes,
                telemetryConfigs: telemetryByModel[model.modelCode] || telemetryByModel['GLOBAL'] || [],
                description: model.description,
                createdAt: model.createdAt,
                updatedAt: model.updatedAt,
            }))
        });
    } catch (error) {
        console.error('Error fetching VFD models:', error);
        res.status(500).json({
            error: 'Failed to fetch VFD models',
            message: error.message
        });
    }
});

/**
 * GET /api/vfd-models/:modelCode
 * Get a specific VFD model by model code
 */
router.get('/:modelCode', async (req, res) => {
    try {
        const { modelCode } = req.params;

        const vfdModel = await prisma.vfdModel.findUnique({
            where: { modelCode }
        });

        if (!vfdModel) {
            return res.status(404).json({
                error: 'VFD model not found'
            });
        }

        // Retrieve model telemetry configs from telemetry_configs table
        const telemetryConfigs = await prisma.telemetryConfig.findMany({
            where: { vfdModel: { in: [modelCode, 'GLOBAL'] } },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        });

        res.json({
            success: true,
            vfdModel: {
                id: vfdModel.id,
                modelCode: vfdModel.modelCode,
                modelName: vfdModel.modelName,
                manufacturer: vfdModel.manufacturer,
                daddCommand: vfdModel.daddCommand,
                errorCodes: vfdModel.errorCodes,
                statusCodes: vfdModel.statusCodes,
                telemetryConfigs,
                description: vfdModel.description,
                createdAt: vfdModel.createdAt,
                updatedAt: vfdModel.updatedAt,
            }
        });
    } catch (error) {
        console.error('Error fetching VFD model:', error);
        res.status(500).json({
            error: 'Failed to fetch VFD model',
            message: error.message
        });
    }
});

async function syncModelTelemetry(modelCode, telemetryConfigs) {
    if (!telemetryConfigs) return;
    const list = Array.isArray(telemetryConfigs) ? telemetryConfigs : Object.values(telemetryConfigs);
    for (const cfg of list) {
        if (!cfg.cmdKey) continue;
        await prisma.telemetryConfig.upsert({
            where: {
                vfdModel_cmdKey: {
                    vfdModel: modelCode,
                    cmdKey: cfg.cmdKey.trim().toUpperCase(),
                },
            },
            update: {
                displayName: cfg.displayName || cfg.cmdKey,
                unit: cfg.unit !== undefined ? cfg.unit : '',
                scaleFactor: cfg.scaleFactor !== undefined ? parseFloat(cfg.scaleFactor) : 1.0,
                decimals: cfg.decimals !== undefined ? parseInt(cfg.decimals, 10) : 0,
                defaultAddr: cfg.defaultAddr ? cfg.defaultAddr.trim() : null,
                kpiTarget: cfg.kpiTarget ? cfg.kpiTarget.trim() : null,
                sortOrder: cfg.sortOrder !== undefined ? parseInt(cfg.sortOrder, 10) : 0,
            },
            create: {
                vfdModel: modelCode,
                cmdKey: cfg.cmdKey.trim().toUpperCase(),
                displayName: cfg.displayName || cfg.cmdKey,
                unit: cfg.unit !== undefined ? cfg.unit : '',
                scaleFactor: cfg.scaleFactor !== undefined ? parseFloat(cfg.scaleFactor) : 1.0,
                decimals: cfg.decimals !== undefined ? parseInt(cfg.decimals, 10) : 0,
                defaultAddr: cfg.defaultAddr ? cfg.defaultAddr.trim() : null,
                kpiTarget: cfg.kpiTarget ? cfg.kpiTarget.trim() : null,
                sortOrder: cfg.sortOrder !== undefined ? parseInt(cfg.sortOrder, 10) : 0,
            },
        });
    }
}

/**
 * POST /api/vfd-models
 * Create a new VFD model
 */
router.post('/', async (req, res) => {
    try {
        const { modelCode, modelName, manufacturer, daddCommand, errorCodes, statusCodes, telemetryConfigs, description } = req.body;

        if (!modelCode || !modelName || !manufacturer || !daddCommand) {
            return res.status(400).json({
                error: 'Missing required fields: modelCode, modelName, manufacturer, daddCommand'
            });
        }

        if (!errorCodes || (typeof errorCodes === 'object' && Object.keys(errorCodes).length === 0)) {
            return res.status(400).json({
                error: 'Error codes dictionary (errorCodes) is required'
            });
        }

        const existing = await prisma.vfdModel.findUnique({
            where: { modelCode }
        });

        let vfdModel;
        if (existing) {
            vfdModel = await prisma.vfdModel.update({
                where: { modelCode },
                data: {
                    modelName,
                    manufacturer,
                    daddCommand,
                    errorCodes,
                    statusCodes: statusCodes || null,
                    description: description || null,
                    isActive: true,
                }
            });

            await syncModelTelemetry(modelCode, telemetryConfigs);
            const currentConfigs = await prisma.telemetryConfig.findMany({
                where: { vfdModel: { in: [modelCode, 'GLOBAL'] } },
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            });

            return res.status(200).json({
                success: true,
                message: existing.isActive ? 'VFD model updated successfully' : 'VFD model reactivated successfully',
                vfdModel: {
                    id: vfdModel.id,
                    modelCode: vfdModel.modelCode,
                    modelName: vfdModel.modelName,
                    manufacturer: vfdModel.manufacturer,
                    daddCommand: vfdModel.daddCommand,
                    errorCodes: vfdModel.errorCodes,
                    statusCodes: vfdModel.statusCodes,
                    telemetryConfigs: currentConfigs,
                    description: vfdModel.description,
                    createdAt: vfdModel.createdAt,
                    updatedAt: vfdModel.updatedAt,
                }
            });
        }

        vfdModel = await prisma.vfdModel.create({
            data: {
                modelCode,
                modelName,
                manufacturer,
                daddCommand,
                errorCodes,
                statusCodes: statusCodes || null,
                description: description || null,
            }
        });

        await syncModelTelemetry(modelCode, telemetryConfigs);
        const currentConfigs = await prisma.telemetryConfig.findMany({
            where: { vfdModel: { in: [modelCode, 'GLOBAL'] } },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        });

        res.status(201).json({
            success: true,
            message: 'VFD model created successfully',
            vfdModel: {
                id: vfdModel.id,
                modelCode: vfdModel.modelCode,
                modelName: vfdModel.modelName,
                manufacturer: vfdModel.manufacturer,
                daddCommand: vfdModel.daddCommand,
                errorCodes: vfdModel.errorCodes,
                statusCodes: vfdModel.statusCodes,
                telemetryConfigs: currentConfigs,
                description: vfdModel.description,
                createdAt: vfdModel.createdAt,
                updatedAt: vfdModel.updatedAt,
            }
        });
    } catch (error) {
        console.error('Error creating VFD model:', error);
        res.status(500).json({
            error: 'Failed to create VFD model',
            message: error.message
        });
    }
});

/**
 * PUT /api/vfd-models/:modelCode
 * Update an existing VFD model
 */
router.put('/:modelCode', async (req, res) => {
    try {
        const { modelCode } = req.params;
        const { modelName, manufacturer, daddCommand, errorCodes, statusCodes, telemetryConfigs, description, isActive } = req.body;

        const existing = await prisma.vfdModel.findUnique({
            where: { modelCode }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'VFD model not found'
            });
        }

        const data = {};
        if (modelName !== undefined) data.modelName = modelName;
        if (manufacturer !== undefined) data.manufacturer = manufacturer;
        if (daddCommand !== undefined) data.daddCommand = daddCommand;
        if (errorCodes !== undefined) data.errorCodes = errorCodes;
        if (statusCodes !== undefined) data.statusCodes = statusCodes;
        if (description !== undefined) data.description = description;
        if (isActive !== undefined) data.isActive = isActive;

        const vfdModel = await prisma.vfdModel.update({
            where: { modelCode },
            data
        });

        if (telemetryConfigs !== undefined) {
            await syncModelTelemetry(modelCode, telemetryConfigs);
        }

        const currentConfigs = await prisma.telemetryConfig.findMany({
            where: { vfdModel: { in: [modelCode, 'GLOBAL'] } },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        });

        res.json({
            success: true,
            message: 'VFD model updated successfully',
            vfdModel: {
                id: vfdModel.id,
                modelCode: vfdModel.modelCode,
                modelName: vfdModel.modelName,
                manufacturer: vfdModel.manufacturer,
                daddCommand: vfdModel.daddCommand,
                errorCodes: vfdModel.errorCodes,
                statusCodes: vfdModel.statusCodes,
                telemetryConfigs: currentConfigs,
                description: vfdModel.description,
                isActive: vfdModel.isActive,
                createdAt: vfdModel.createdAt,
                updatedAt: vfdModel.updatedAt,
            }
        });
    } catch (error) {
        console.error('Error updating VFD model:', error);
        res.status(500).json({
            error: 'Failed to update VFD model',
            message: error.message
        });
    }
});

/**
 * DELETE /api/vfd-models/:modelCode
 * Delete (soft delete) a VFD model
 */
router.delete('/:modelCode', async (req, res) => {
    try {
        const { modelCode } = req.params;

        const existing = await prisma.vfdModel.findUnique({
            where: { modelCode }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'VFD model not found'
            });
        }

        try {
            await prisma.vfdModel.delete({
                where: { modelCode }
            });
        } catch {
            await prisma.vfdModel.update({
                where: { modelCode },
                data: { isActive: false }
            });
        }

        res.json({
            success: true,
            message: 'VFD model deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting VFD model:', error);
        res.status(500).json({
            error: 'Failed to delete VFD model',
            message: error.message
        });
    }
});

module.exports = router;
