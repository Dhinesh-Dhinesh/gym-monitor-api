import { NextFunction, Response } from "express";
import * as Joi from "joi";

export const validate = (schema: Joi.ObjectSchema<any>) => {
    return (req: any, res: Response, next: NextFunction) => {

        // Extract the data to be validated from the request body
        const dataToValidate = req.body;

        // Validate the data against the provided schema
        const { error, value }: Joi.ValidationResult<any> = schema.validate(dataToValidate);

        if (error) {
            // If validation fails, send a 400 Bad Request response with details
            const details = error.details[0].message;

            res.status(400).json({
                error: {
                    message: "Validation Error",
                    details,
                },
            });
        } else {
            // If validation succeeds, attach the validated data to the request and call the next middleware
            Object.assign(req, value);
            next();
        }
    };
};