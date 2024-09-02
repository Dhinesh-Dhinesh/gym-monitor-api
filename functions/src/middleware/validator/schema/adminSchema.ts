import * as Joi from "joi";

type CreateAdmin = {
    name: string,
    email: string,
    phone: string,
    gender: string,
    gym_id: string,
    password: string
}

export const createAdminSchema = Joi.object<CreateAdmin, true>({
    name: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.string().required(),
    gender: Joi.string().required(),
    gym_id: Joi.string().required(),
    password: Joi.string().required(),
}).unknown(false);