import * as Joi from "joi";

type MemberBody = {
    name: string;
    email: string;
    gender: 'male' | 'female';
    dob: () => any;
    address: string;
    phone: string;
    trainingType: 'general' | 'personal';
    joinedAt: () => any;
    notes?: string;
    gym_id: string;
    createdBy: string;
};

type AddMember = MemberBody & {
    plan: {
        name: string,
        months: number,
        price: number,
        paidAmount: number
    }
};

// Custom function to validate if value is a valid Timestamp
const isValidTimestamp = (value: any, helpers: Joi.CustomHelpers): any => {
    if (typeof value !== 'object' || value === null || !('seconds' in value) || !('nanoseconds' in value)) {
        return helpers.error('any.invalid');
    }
    return value; // Return the value if it's valid
};



export const addMemberSchema = Joi.object<AddMember, true>({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    gender: Joi.string().valid('male', 'female').required(),
    dob: Joi.custom(isValidTimestamp, 'Timestamp validation').required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    trainingType: Joi.string().valid('general', 'personal').required(),
    joinedAt: Joi.custom(isValidTimestamp, 'Timestamp validation').required(),
    notes: Joi.string(),
    gym_id: Joi.string().required(),
    createdBy: Joi.string().required(),
    plan: Joi.object({
        name: Joi.string().required(),
        months: Joi.number().integer().positive().required(),
        price: Joi.number().integer().positive().required(),
        paidAmount: Joi.number().integer().positive().required()
    }).required()
}).unknown(false).strict();