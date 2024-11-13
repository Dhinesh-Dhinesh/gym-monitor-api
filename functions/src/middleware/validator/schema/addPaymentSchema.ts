import * as Joi from "joi";
import { AddPayment } from "../../../controller/adminController";
import { isValidTimestamp } from "./createMemberSchema";

export const addPaymentSchema = Joi.object<AddPayment['body'], true>({
    meta: Joi.object({
        gymId: Joi.string().required(),
        userId: Joi.string().required(),
        planId: Joi.string().required(),
    }).required().unknown(false),

    data: Joi.object({
        date: Joi.custom(isValidTimestamp, 'Timestamp validation').required(),
        amount: Joi.number().greater(0).required(),
        addedBy: Joi.string().required(),
    }).required().unknown(false),
}).unknown(false);