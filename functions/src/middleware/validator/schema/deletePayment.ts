import Joi from 'joi';

const deletePaymentSchema = Joi.object({
    gymId: Joi.string().required(),
    userId: Joi.string().required(),
    planId: Joi.string().required(),
    paymentId: Joi.string().required(),
}).messages({
    'string.base': `"{{#label}}" should be a type of 'string'`,
    'string.empty': `"{{#label}}" cannot be an empty field`,
    'any.required': `"{{#label}}" is a required field`
});

export { deletePaymentSchema };
