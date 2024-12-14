import Joi from 'joi';

// Define Joi schema for req.body
export const updateMemberSchema = Joi.object({
    name: Joi.string().optional().min(1).max(100).messages({
        "string.base": "Name must be a string.",
        "string.min": "Name must be at least 1 character long.",
        "string.max": "Name must not exceed 100 characters.",
    }),
    email: Joi.string().optional().email().messages({
        "string.base": "Email must be a string.",
        "string.email": "Email must be a valid email address.",
    }),
    phone: Joi.string()
        .optional()
        .pattern(/^[0-9]{10}$/)
        .messages({
            "string.base": "Phone must be a string.",
            "string.pattern.base": "Phone must be a valid 10-digit number.",
        }),
    gender: Joi.string().optional().valid("male", "female").messages({
        "string.base": "Gender must be a string.",
        "any.only": "Gender must be one of 'male', 'female'.",
    }),
    dob: Joi.string().optional().pattern(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
        'ISO 8601 date format'
    ).messages({
        "string.base": "Date of birth must be a string.",
        "string.pattern.base": "Date of birth must be in ISO format (e.g., '2024-11-15T00:00:00.000Z').",
    }),
    // joinedAt: Joi.date().iso().optional().messages({
    //     "date.base": "Joined date must be a valid date.",
    //     "date.format": "Joined date must be in ISO format.",
    // }),
    trainingType: Joi.string().optional().valid("general", "personal").messages({
        "string.base": "Training type must be a string.",
        "any.only": "Training type must be one of 'general', 'personal'.",
    }),
    address: Joi.string().optional().max(255).messages({
        "string.base": "Address must be a string.",
        "string.max": "Address must not exceed 255 characters.",
    }),
    notes: Joi.string().optional().allow('').max(500).messages({
        "string.base": "Notes must be a string.",
        "string.max": "Notes must not exceed 500 characters.",
    }),
}).unknown(false).strict();