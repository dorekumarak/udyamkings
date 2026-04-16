const { FormConfig } = require('../models');
const { Op } = require('sequelize');

// Get all form configurations
const getAllFormConfigs = async (req, res) => {
    try {
        const configs = await FormConfig.findAll({
            order: [['display_order', 'ASC']]
        });
        res.json(configs);
    } catch (error) {
        console.error('Error fetching form configs:', error);
        res.status(500).json({ message: 'Error fetching form configurations' });
    }
};

// Get single form config
const getFormConfig = async (req, res) => {
    try {
        const config = await FormConfig.findByPk(req.params.id);
        if (!config) {
            return res.status(404).json({ message: 'Form configuration not found' });
        }
        res.json(config);
    } catch (error) {
        console.error('Error fetching form config:', error);
        res.status(500).json({ message: 'Error fetching form configuration' });
    }
};

// Create or update form config
const saveFormConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const configData = req.body;

        if (id) {
            // Update existing
            const [updated] = await FormConfig.update(configData, {
                where: { id }
            });
            if (updated) {
                const updatedConfig = await FormConfig.findByPk(id);
                return res.json(updatedConfig);
            }
            return res.status(404).json({ message: 'Form configuration not found' });
        } else {
            // Create new
            const newConfig = await FormConfig.create(configData);
            return res.status(201).json(newConfig);
        }
    } catch (error) {
        console.error('Error saving form config:', error);
        res.status(500).json({ message: 'Error saving form configuration' });
    }
};

// Delete form config
const deleteFormConfig = async (req, res) => {
    try {
        const deleted = await FormConfig.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            return res.json({ message: 'Form configuration deleted' });
        }
        return res.status(404).json({ message: 'Form configuration not found' });
    } catch (error) {
        console.error('Error deleting form config:', error);
        res.status(500).json({ message: 'Error deleting form configuration' });
    }
};

// Reorder form configs
const reorderFormConfigs = async (req, res) => {
    try {
        const { configs } = req.body;
        if (!Array.isArray(configs)) {
            return res.status(400).json({ message: 'Invalid request body' });
        }

        await Promise.all(
            configs.map((config) =>
                FormConfig.update(
                    { display_order: config.display_order },
                    { where: { id: config.id } }
                )
            )
        );

        res.json({ message: 'Form configurations reordered successfully' });
    } catch (error) {
        console.error('Error reordering form configs:', error);
        res.status(500).json({ message: 'Error reordering form configurations' });
    }
};

module.exports = {
    getAllFormConfigs,
    getFormConfig,
    saveFormConfig,
    deleteFormConfig,
    reorderFormConfigs
};
