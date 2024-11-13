import * as Joi from "joi";

type AddPlan = {
    name: string;
    price: number;
    months: number;
    gym_id: string;
};

export const createPlanSchema = Joi.object<AddPlan, true>({
    name: Joi.string().required(),
    price: Joi.number().required(),
    months: Joi.number().required(),
    gym_id: Joi.string().required(),
}).unknown(false).strict();;