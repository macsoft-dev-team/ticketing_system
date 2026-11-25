const express = require('express');
const { prisma } = require('../lib/clients');

const router = express.Router();

/**
 * GET /api/vfdparams
 * Get list of all distinct VFD models with parameters
 */
router.get('/', async (req, res) => {
    try {
        const activeModels = await prisma.vfdModel.findMany({
            where: { isActive: true },
            select: { modelCode: true },
            orderBy: { modelCode: 'asc' },
        });

        const paramModels = await prisma.vfdParameter.findMany({
            distinct: ['vfdModel'],
            select: { vfdModel: true },
        });

        const modelSet = new Set();
        activeModels.forEach(m => m.modelCode && modelSet.add(m.modelCode));
        paramModels.forEach(m => m.vfdModel && modelSet.add(m.vfdModel));

        if (modelSet.size === 0) {
            ['SI21', 'SI22', 'Hex'].forEach(m => modelSet.add(m));
        }

        const models = Array.from(modelSet);
        res.json({
            models,
            total: models.length,
        });
    } catch (error) {
        console.error('VFD models fetch error:', error);
        res.json({
            models: ['SI21', 'SI22', 'Hex'],
            total: 3,
        });
    }
});

/**
 * GET /api/vfdparams/:vfdModel
 * Get all predefined parameters for a specific VFD model
 */
router.get('/:vfdModel', async (req, res) => {
    try {
        const { vfdModel } = req.params;
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) || 10;
        const search = (req.query.search || req.query.query || '').trim();

        // Support model aliases / variants (SI21 <-> S121, SI22 <-> S122, HEX <-> Hex)
        let modelCandidates = [vfdModel];
        const upperModel = vfdModel.toUpperCase();
        if (upperModel === 'SI21' || upperModel === 'S121') {
            modelCandidates = ['SI21', 'S121', vfdModel];
        } else if (upperModel === 'SI22' || upperModel === 'S122') {
            modelCandidates = ['SI22', 'S122', vfdModel];
        } else if (upperModel === 'HEX') {
            modelCandidates = ['HEX', 'Hex', vfdModel];
        }

        const where = { vfdModel: { in: modelCandidates } };
        if (search) {
            const orConditions = [
                { paramName: { contains: search } },
                { address: { contains: search } },
            ];
            const parsedVal = parseInt(search);
            if (!isNaN(parsedVal)) {
                orConditions.push({ value: { equals: parsedVal } });
            }
            where.OR = orConditions;
        }

        const total = await prisma.vfdParameter.count({ where });

        const findOptions = {
            where,
            orderBy: [{ address: 'asc' }],
        };

        if (!isNaN(page) && page > 0) {
            findOptions.skip = (page - 1) * limit;
            findOptions.take = limit;
        }

        const parameters = await prisma.vfdParameter.findMany(findOptions);

        res.json({
            vfdModel,
            total,
            page: !isNaN(page) ? page : 1,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            parameters: parameters.map(param => ({
                id: param.id,
                paramName: param.paramName,
                address: param.address,
                value: param.value
            })),
        });
    } catch (error) {
        console.error('VFD parameters fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch VFD parameters'
        });
    }
});

/**
 * POST /api/vfdparams
 * Create or update VFD parameter
 */
router.post('/', async (req, res) => {
    try {
        const { vfdModel, paramName, address, value } = req.body;
        const addressText = String(address ?? '').trim();

        if (!vfdModel || !paramName || !addressText) {
            return res.status(400).json({
                error: 'vfdModel, paramName, and address are required'
            });
        }

        const parameter = await prisma.vfdParameter.upsert({
            where: {
                vfdModel_address: {
                    vfdModel,
                    address: addressText,
                },
            },
            update: {
                paramName,
                value: value !== undefined ? parseInt(value) : 0,
            },
            create: {
                vfdModel,
                paramName,
                address: addressText,
                value: value !== undefined ? parseInt(value) : 0,
            },
        });

        res.json({
            message: 'VFD parameter saved successfully',
            parameter: {
                id: parameter.id,
                vfdModel: parameter.vfdModel,
                paramName: parameter.paramName,
                address: parameter.address,
                value: parameter.value,
            },
        });
    } catch (error) {
        console.error('VFD parameter save error:', error);
        res.status(500).json({
            error: 'Failed to save VFD parameter'
        });
    }
});

/**
 * DELETE /api/vfdparams/:vfdModel/:address
 * Delete a VFD parameter for a model/address pair
 */
router.delete('/:vfdModel/:address', async (req, res) => {
    try {
        const { vfdModel, address } = req.params;
        const addressText = String(address ?? '').trim();

        const parameter = await prisma.vfdParameter.findUnique({
            where: {
                vfdModel_address: {
                    vfdModel,
                    address: addressText,
                },
            },
        });

        if (!parameter) {
            return res.status(404).json({
                error: 'VFD parameter not found'
            });
        }

        await prisma.vfdParameter.delete({
            where: {
                vfdModel_address: {
                    vfdModel,
                    address: addressText,
                },
            },
        });

        res.json({
            message: 'VFD parameter deleted successfully',
            deletedId: parameter.id,
        });
    } catch (error) {
        console.error('VFD parameter delete error:', error);
        res.status(500).json({
            error: 'Failed to delete VFD parameter'
        });
    }
});

module.exports = router;
