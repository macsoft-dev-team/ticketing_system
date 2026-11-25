const express = require('express');
const { prisma } = require('../lib/clients');

const router = express.Router();

/**
 * Helper to get alias candidates for model codes
 */
function getModelCandidates(vfdModel) {
    if (!vfdModel) return ['GLOBAL'];
    const upper = vfdModel.trim().toUpperCase();
    if (upper === 'SI21' || upper === 'S121') {
        return [vfdModel, 'SI21', 'S121', 'GLOBAL'];
    } else if (upper === 'SI22' || upper === 'S122') {
        return [vfdModel, 'SI22', 'S122', 'GLOBAL'];
    } else if (upper === 'HEX') {
        return [vfdModel, 'HEX', 'Hex', 'GLOBAL'];
    }
    return [vfdModel, 'GLOBAL'];
}

/**
 * Handler for fetching telemetry configurations with model-specific overrides and global fallbacks
 */
async function getTelemetryConfigsHandler(req, res) {
    try {
        const vfdModel = req.params.vfdModel || req.query.vfdModel || 'GLOBAL';
        const candidates = getModelCandidates(vfdModel);

        const configs = await prisma.telemetryConfig.findMany({
            where: {
                vfdModel: { in: candidates },
            },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        });

        // Merge overrides: model-specific configs override GLOBAL
        const configMap = new Map();
        
        // 1. Apply GLOBAL first
        for (const c of configs.filter(x => x.vfdModel === 'GLOBAL')) {
            configMap.set(c.cmdKey, c);
        }

        // 2. Apply model-specific overrides
        for (const c of configs.filter(x => x.vfdModel !== 'GLOBAL')) {
            configMap.set(c.cmdKey, c);
        }

        const resolvedConfigs = Array.from(configMap.values());

        res.json({
            success: true,
            vfdModel,
            total: resolvedConfigs.length,
            configs: resolvedConfigs,
        });
    } catch (error) {
        console.error('Error fetching telemetry configs:', error);
        res.status(500).json({ error: 'Failed to fetch telemetry configurations' });
    }
}

// Distinct models endpoint
router.get('/models', async (req, res) => {
    try {
        const dbModels = await prisma.telemetryConfig.findMany({
            select: { vfdModel: true },
            distinct: ['vfdModel'],
            orderBy: { vfdModel: 'asc' },
        });
        const modelList = dbModels.map(m => m.vfdModel);
        if (!modelList.includes('GLOBAL')) modelList.unshift('GLOBAL');
        res.json({ success: true, models: modelList });
    } catch (error) {
        console.error('Error fetching telemetry config models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// Fetch all telemetry configurations for all models
router.get('/all', async (req, res) => {
    try {
        const configs = await prisma.telemetryConfig.findMany({
            orderBy: [{ vfdModel: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        });
        res.json({
            success: true,
            total: configs.length,
            configs,
        });
    } catch (error) {
        console.error('Error fetching all telemetry configs:', error);
        res.status(500).json({ error: 'Failed to fetch all telemetry configurations' });
    }
});

router.get('/', getTelemetryConfigsHandler);
router.get('/:vfdModel', getTelemetryConfigsHandler);

// Create or upsert telemetry configuration
router.post('/', async (req, res) => {
    try {
        const { vfdModel, cmdKey, displayName, unit, scaleFactor, decimals, defaultAddr, kpiTarget, sortOrder } = req.body;
        if (!vfdModel || !cmdKey || !displayName) {
            return res.status(400).json({ error: 'vfdModel, cmdKey, and displayName are required' });
        }
        const config = await prisma.telemetryConfig.upsert({
            where: {
                vfdModel_cmdKey: {
                    vfdModel: vfdModel.trim(),
                    cmdKey: cmdKey.trim().toUpperCase(),
                },
            },
            update: {
                displayName: displayName.trim(),
                unit: unit !== undefined ? unit.trim() : '',
                scaleFactor: scaleFactor !== undefined ? parseFloat(scaleFactor) : 1.0,
                decimals: decimals !== undefined ? parseInt(decimals, 10) : 0,
                defaultAddr: defaultAddr ? defaultAddr.trim() : null,
                kpiTarget: kpiTarget ? kpiTarget.trim() : null,
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
            },
            create: {
                vfdModel: vfdModel.trim(),
                cmdKey: cmdKey.trim().toUpperCase(),
                displayName: displayName.trim(),
                unit: unit !== undefined ? unit.trim() : '',
                scaleFactor: scaleFactor !== undefined ? parseFloat(scaleFactor) : 1.0,
                decimals: decimals !== undefined ? parseInt(decimals, 10) : 0,
                defaultAddr: defaultAddr ? defaultAddr.trim() : null,
                kpiTarget: kpiTarget ? kpiTarget.trim() : null,
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
            },
        });
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error saving telemetry config:', error);
        res.status(500).json({ error: error.message || 'Failed to save telemetry configuration' });
    }
});

// Update telemetry configuration by ID
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { vfdModel, cmdKey, displayName, unit, scaleFactor, decimals, defaultAddr, kpiTarget, sortOrder } = req.body;
        const config = await prisma.telemetryConfig.update({
            where: { id },
            data: {
                ...(vfdModel ? { vfdModel: vfdModel.trim() } : {}),
                ...(cmdKey ? { cmdKey: cmdKey.trim().toUpperCase() } : {}),
                ...(displayName ? { displayName: displayName.trim() } : {}),
                ...(unit !== undefined ? { unit: unit.trim() } : {}),
                ...(scaleFactor !== undefined ? { scaleFactor: parseFloat(scaleFactor) } : {}),
                ...(decimals !== undefined ? { decimals: parseInt(decimals, 10) } : {}),
                ...(defaultAddr !== undefined ? { defaultAddr: defaultAddr ? defaultAddr.trim() : null } : {}),
                ...(kpiTarget !== undefined ? { kpiTarget: kpiTarget ? kpiTarget.trim() : null } : {}),
                ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) } : {}),
            },
        });
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error updating telemetry config:', error);
        res.status(500).json({ error: error.message || 'Failed to update telemetry configuration' });
    }
});

// Delete telemetry configuration by ID
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await prisma.telemetryConfig.delete({ where: { id } });
        res.json({ success: true, message: 'Telemetry configuration deleted successfully' });
    } catch (error) {
        console.error('Error deleting telemetry config:', error);
        res.status(500).json({ error: error.message || 'Failed to delete telemetry configuration' });
    }
});

module.exports = router;
