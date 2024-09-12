import * as Joi from "joi";

type MemberBody = {
    name: string;
    email: string;
    gender: 'male' | 'female';
    dob: string;
    address: string;
    phone: string;
    trainingType: 'general' | 'personal';
    joinedAt: string;
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

export const addMemberSchema = Joi.object<AddMember, true>({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    gender: Joi.string().valid('male', 'female').required(),
    dob: Joi.string().isoDate().required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    trainingType: Joi.string().valid('general', 'personal').required(),
    joinedAt: Joi.string().isoDate().required(),
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