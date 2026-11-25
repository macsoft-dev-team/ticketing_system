const express = require('express');
const { prisma } = require('../lib/clients');

const router = express.Router();

/**
 * GET /api/config
 * Get all configurations for authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const user = req.user || {};
        const isAdmin = ['admin', 'MACSOFT_ADMIN', 'MACSOFT_HEAD'].includes(user.role);
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) || 10;
        const search = (req.query.search || req.query.query || '').trim();
        const { projectId, companyId, hp, type, acDc, oilWater } = req.query;

        // Build where clause based on role
        const where = {};
        if (isAdmin) {
            if (companyId) where.companyId = companyId;
        } else if (user.orgCode) {
            where.companyId = user.orgCode;
        }

        if (projectId) where.projectId = projectId;
        if (hp) where.hp = hp;
        if (type) where.type = type;
        if (acDc) where.acDc = acDc;
        if (oilWater) where.oilWater = oilWater;

        if (search) {
            where.OR = [
                { projectId: { contains: search } },
                { companyId: { contains: search } },
                { hp: { contains: search } },
                { type: { contains: search } },
            ];
        }

        const total = await prisma.config.count({ where });

        const findOptions = {
            where,
            orderBy: { updatedAt: 'desc' },
        };

        if (!isNaN(page) && page > 0) {
            findOptions.skip = (page - 1) * limit;
            findOptions.take = limit;
        }

        const configs = await prisma.config.findMany(findOptions);

        res.json({
            total,
            page: !isNaN(page) ? page : 1,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            configs: configs.map(config => ({
                id: config.id,
                projectId: config.projectId,
                companyId: config.companyId,
                hp: config.hp,
                type: config.type,
                acDc: config.acDc,
                oilWater: config.oilWater,
                commands: config.commands,
                version: config.version,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt,
            })),
        });
    } catch (error) {
        console.error('Config fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch configuration'
        });
    }
});

/**
 * POST /api/config
 * Create or update configuration for authenticated user
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        const userRole = req.user?.role;
        const userOrg = req.user?.orgCode;
        let { projectId, companyId, hp, type, acDc, oilWater, commands } = req.body;

        const isAdmin = ['admin', 'MACSOFT_ADMIN', 'MACSOFT_HEAD'].includes(userRole);
        if (!isAdmin && userOrg) {
            companyId = userOrg;
        }

        if (!projectId || !companyId || !hp || !type || !acDc || !oilWater || !commands) {
            return res.status(400).json({
                error: 'All fields are required: projectId, companyId, hp, type, acDc, oilWater, commands'
            });
        }

        // If no user ID is found, fallback to first available admin user
        let effectiveUserId = userId;
        if (!effectiveUserId) {
            const firstUser = await prisma.user.findFirst();
            effectiveUserId = firstUser ? firstUser.id : 1;
        }

        const config = await prisma.config.upsert({
            where: {
                userId_projectId_companyId_hp_type_acDc_oilWater: {
                    userId: effectiveUserId,
                    projectId,
                    companyId,
                    hp,
                    type,
                    acDc,
                    oilWater,
                },
            },
            update: {
                commands,
                version: { increment: 1 },
            },
            create: {
                userId: effectiveUserId,
                projectId,
                companyId,
                hp,
                type,
                acDc,
                oilWater,
                commands,
                version: 1,
            },
        });

        res.json({
            message: 'Configuration saved successfully',
            config: {
                id: config.id,
                projectId: config.projectId,
                companyId: config.companyId,
                hp: config.hp,
                type: config.type,
                acDc: config.acDc,
                oilWater: config.oilWater,
                commands: config.commands,
                version: config.version,
                updatedAt: config.updatedAt,
            },
        });
    } catch (error) {
        console.error('Config save error:', error);
        res.status(500).json({
            error: 'Failed to save configuration'
        });
    }
});

/**
 * GET /api/config/:id
 * Get a specific configuration by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const user = req.user || {};
        const isAdmin = ['admin', 'MACSOFT_ADMIN', 'MACSOFT_HEAD'].includes(user.role);
        const configId = parseInt(req.params.id);

        const where = { id: configId };
        if (!isAdmin && user.orgCode) {
            where.companyId = user.orgCode;
        }

        const config = await prisma.config.findFirst({ where });

        if (!config) {
            return res.status(404).json({
                error: 'Configuration not found'
            });
        }

        res.json({
            id: config.id,
            projectId: config.projectId,
            companyId: config.companyId,
            hp: config.hp,
            type: config.type,
            acDc: config.acDc,
            oilWater: config.oilWater,
            commands: config.commands,
            version: config.version,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
        });
    } catch (error) {
        console.error('Config fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch configuration'
        });
    }
});

/**
 * DELETE /api/config/:id
 * Delete a specific configuration
 */
router.delete('/:id', async (req, res) => {
    try {
        const user = req.user || {};
        const isAdmin = ['admin', 'MACSOFT_ADMIN', 'MACSOFT_HEAD'].includes(user.role);
        const configId = parseInt(req.params.id);

        const where = { id: configId };
        if (!isAdmin && user.orgCode) {
            where.companyId = user.orgCode;
        }

        const config = await prisma.config.findFirst({ where });

        if (!config) {
            return res.status(404).json({
                error: 'Configuration not found'
            });
        }

        await prisma.config.delete({
            where: { id: configId },
        });

        res.json({
            message: 'Configuration deleted successfully',
            deletedId: configId,
        });
    } catch (error) {
        console.error('Config delete error:', error);
        res.status(500).json({
            error: 'Failed to delete configuration'
        });
    }
});

module.exports = router;
