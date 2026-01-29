const Joi = require('joi');

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map((detail) => detail.message);
            return res.status(400).json({ error: 'Validation Error', details: errors });
        }
        next();
    };
};

const schemas = {
    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        name: Joi.string().required(),
        role: Joi.string().valid('USER', 'PHARMACY_ADMIN').optional(),
        pharmacyName: Joi.string().optional().allow(''),
        pharmacyAddress: Joi.string().optional().allow(''),
        pharmacyPhone: Joi.string().optional().allow(''),
        licenseNumber: Joi.string().optional().allow(''),
        documents: Joi.string().optional().allow('')
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),
    createPharmacy: Joi.object({
        name: Joi.string().required(),
        address: Joi.string().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        phone: Joi.string().optional(),
        email: Joi.string().email().optional()
    }),
    createDrug: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional().allow(''),
        manufacturer: Joi.string().optional().allow(''),
        image: Joi.string().uri().optional().allow(''),
        category: Joi.string().optional().allow(''),
        dosageForm: Joi.string().optional().allow(''),
        strength: Joi.string().optional().allow(''),
        requiresPrescription: Joi.boolean().optional()
    }),
    addInventory: Joi.object({
        drugId: Joi.string().uuid().required(),
        price: Joi.number().positive().required(),
        inStock: Joi.boolean().optional()
    }),
    createOrder: Joi.object({
        pharmacyId: Joi.string().required(),
        pharmacyName: Joi.string().optional(),
        paymentMethod: Joi.string().valid('WALLET', 'ONLINE', 'CASH').optional(),
        items: Joi.array().items(
            Joi.object({
                drugId: Joi.string().required(),
                drugName: Joi.string().optional(),
                quantity: Joi.number().integer().positive().required(),
                price: Joi.number().optional()
            })
        ).required()
    }),
};

module.exports = { validate, schemas };
