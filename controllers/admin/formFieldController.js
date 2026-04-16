const { FormField } = require('../../models');
const asyncHandler = require('../../middleware/async');
const { Op } = require('sequelize');

// @desc    Get all form fields
// @route   GET /api/v1/admin/form-fields
// @access  Private/Admin
exports.getFormFields = asyncHandler(async (req, res) => {
    const formFields = await FormField.findAll({
        order: [['field_order', 'ASC'], ['field_name', 'ASC']]
    });

    res.status(200).json({
        success: true,
        count: formFields.length,
        data: formFields
    });
});

// @desc    Get single form field by ID
// @route   GET /api/v1/admin/form-fields/:id
// @access  Private/Admin
exports.getFormField = asyncHandler(async (req, res) => {
    const formField = await FormField.findByPk(req.params.id);

    if (!formField) {
        return res.status(404).json({
            success: false,
            message: 'Form field not found'
        });
    }

    res.status(200).json({
        success: true,
        data: formField
    });
});

// @desc    Create new form field
// @route   POST /api/v1/admin/form-fields
// @access  Private/Admin
exports.createFormField = asyncHandler(async (req, res) => {
    const {
        field_name,
        field_label,
        field_type,
        is_required,
        placeholder,
        options,
        validation_rules,
        conditional_show,
        field_order
    } = req.body;

    // Check if field name already exists
    const existingField = await FormField.findOne({
        where: { field_name }
    });

    if (existingField) {
        return res.status(400).json({
            success: false,
            message: 'Field name already exists'
        });
    }

    // Parse JSON fields if they're strings
    let parsedOptions = options;
    let parsedValidationRules = validation_rules;
    let parsedConditionalShow = conditional_show;

    if (typeof options === 'string') {
        try {
            parsedOptions = JSON.parse(options);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid options format'
            });
        }
    }

    if (typeof validation_rules === 'string') {
        try {
            parsedValidationRules = JSON.parse(validation_rules);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid validation rules format'
            });
        }
    }

    if (typeof conditional_show === 'string') {
        try {
            parsedConditionalShow = JSON.parse(conditional_show);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid conditional show format'
            });
        }
    }

    const formField = await FormField.create({
        field_name,
        field_label,
        field_type,
        is_required: is_required || false,
        placeholder,
        options: parsedOptions,
        validation_rules: parsedValidationRules || {},
        conditional_show: parsedConditionalShow,
        field_order: field_order || 0
    });

    res.status(201).json({
        success: true,
        message: 'Form field created successfully',
        data: formField
    });
});

// @desc    Update form field
// @route   PUT /api/v1/admin/form-fields/:id
// @access  Private/Admin
exports.updateFormField = asyncHandler(async (req, res) => {
    const formField = await FormField.findByPk(req.params.id);

    if (!formField) {
        return res.status(404).json({
            success: false,
            message: 'Form field not found'
        });
    }

    const {
        field_name,
        field_label,
        field_type,
        is_required,
        placeholder,
        options,
        validation_rules,
        conditional_show,
        field_order
    } = req.body;

    // Check if field name already exists (excluding current field)
    if (field_name && field_name !== formField.field_name) {
        const existingField = await FormField.findOne({
            where: { 
                field_name,
                id: { [Op.ne]: req.params.id }
            }
        });

        if (existingField) {
            return res.status(400).json({
                success: false,
                message: 'Field name already exists'
            });
        }
    }

    // Parse JSON fields if they're strings
    let parsedOptions = options;
    let parsedValidationRules = validation_rules;
    let parsedConditionalShow = conditional_show;

    if (options && typeof options === 'string') {
        try {
            parsedOptions = JSON.parse(options);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid options format'
            });
        }
    }

    if (validation_rules && typeof validation_rules === 'string') {
        try {
            parsedValidationRules = JSON.parse(validation_rules);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid validation rules format'
            });
        }
    }

    if (conditional_show && typeof conditional_show === 'string') {
        try {
            parsedConditionalShow = JSON.parse(conditional_show);
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'Invalid conditional show format'
            });
        }
    }

    // Update form field
    const updateData = {};
    if (field_name !== undefined) updateData.field_name = field_name;
    if (field_label !== undefined) updateData.field_label = field_label;
    if (field_type !== undefined) updateData.field_type = field_type;
    if (is_required !== undefined) updateData.is_required = is_required;
    if (placeholder !== undefined) updateData.placeholder = placeholder;
    if (parsedOptions !== undefined) updateData.options = parsedOptions;
    if (parsedValidationRules !== undefined) updateData.validation_rules = parsedValidationRules;
    if (parsedConditionalShow !== undefined) updateData.conditional_show = parsedConditionalShow;
    if (field_order !== undefined) updateData.field_order = field_order;

    await formField.update(updateData);

    res.status(200).json({
        success: true,
        message: 'Form field updated successfully',
        data: formField
    });
});

// @desc    Delete form field
// @route   DELETE /api/v1/admin/form-fields/:id
// @access  Private/Admin
exports.deleteFormField = asyncHandler(async (req, res) => {
    const formField = await FormField.findByPk(req.params.id);

    if (!formField) {
        return res.status(404).json({
            success: false,
            message: 'Form field not found'
        });
    }

    await formField.destroy();

    res.status(200).json({
        success: true,
        message: 'Form field deleted successfully'
    });
});

// @desc    Reorder form fields
// @route   PUT /api/v1/admin/form-fields/reorder
// @access  Private/Admin
exports.reorderFormFields = asyncHandler(async (req, res) => {
    const { fieldOrders } = req.body;

    if (!Array.isArray(fieldOrders)) {
        return res.status(400).json({
            success: false,
            message: 'fieldOrders must be an array'
        });
    }

    // Update each field order
    for (const item of fieldOrders) {
        if (item.id && item.order !== undefined) {
            await FormField.update(
                { field_order: item.order },
                { where: { id: item.id } }
            );
        }
    }

    res.status(200).json({
        success: true,
        message: 'Form fields reordered successfully'
    });
});

// @desc    Get form schema for frontend
// @route   GET /api/v1/form-schema
// @access  Public
exports.getFormSchema = asyncHandler(async (req, res) => {
    const formFields = await FormField.findAll({
        where: { is_active: true },
        order: [['field_order', 'ASC'], ['field_name', 'ASC']],
        attributes: [
            'field_name',
            'field_label',
            'field_type',
            'is_required',
            'placeholder',
            'options',
            'validation_rules',
            'conditional_show'
        ]
    });

    res.status(200).json({
        success: true,
        data: formFields
    });
});
