import * as Joi from "joi";

type AddMember = {
    name: string;
    email: string;
    gender: 'male' | 'female';
    dob: string;
    address: string;
    phone: string;
    trainingType: 'general' | 'personal';
    planId: string;
    joinedAt: string;
    paidAmount: number;
    notes?: string;
    gym_id: string;
    createdBy: string;
};

export const addMemberSchema = Joi.object<AddMember, true>({
    name: Joi.string().required(),
    email: Joi.string().required(),
    gender: Joi.string().valid('male', 'female').required(),
    dob: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    trainingType: Joi.string().valid('general', 'personal').required(),
    planId: Joi.string().required(),
    joinedAt: Joi.string().required(),
    paidAmount: Joi.number().required(),
    notes: Joi.string(),
    gym_id: Joi.string().required(),
    createdBy: Joi.string().required()
}).unknown(false).strict();