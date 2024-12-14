import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { Response } from "express";

export const verifyAdmin = async (req: any, res: Response, next: any) => {
    const { authorization } = req.headers;

    if (!authorization) {
        res.status(403).send({
            message: "Unauthorized"
        });
    } else {
        try {
            const token = authorization.split("Bearer ")[1];
            const decodedToken = await admin.auth().verifyIdToken(token);
            const { admin: isAdmin } = decodedToken;

            if (isAdmin) {
                req = req;
                next();
            } else {
                logger.warn("Unauthorized access attempt", { structuredData: true });
                res.status(403).send({
                    message: "Unauthorized access attempt"
                });
            }
        } catch (error) {
            res.status(403).send({
                message: "Invalid token"
            });
        }
    }
}