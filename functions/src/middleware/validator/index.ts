import { NextFunction, Response } from "express";
import * as Joi from "joi";
import * as formidable from "formidable-serverless";

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

export const validateMultipart = (schema: Joi.ObjectSchema<any>) => {
    return async (req: any, res: Response, next: NextFunction): Promise<void> => {
        // Create an instance of formidable's IncomingForm
        const form = new formidable.IncomingForm();

        try {
            // Wrap the form parsing in a Promise to use async/await
            const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
                form.parse(req, (err, fields, files) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ fields, files });
                    }
                });
            });

            // Validate fields using the Joi schema
            const { error, value } = schema.validate(fields);
            if (error) {
                const details = error.details[0].message;
                // If validation fails, return a 400 Bad Request
                res.status(400).json({
                    error: {
                        message: 'Validation Error',
                        details,
                    },
                });

                return;
            }

            // Attach validated fields and files to the request object
            req.body = value;
            req.files = files;

            // Proceed to the next middleware
            next();
        } catch (err) {
            // Handle any errors that occur during form parsing
            res.status(400).json({
                error: {
                    message: 'Error parsing form data',
                    details: err,
                },
            });

            return;
        }
    };
};