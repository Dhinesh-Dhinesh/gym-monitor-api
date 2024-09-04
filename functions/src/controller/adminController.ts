import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { FieldValue } from 'firebase-admin/firestore';
import { Response } from "express";

type CreateAdminRequest = {
    body: {
        name: string,
        email: string,
        phone: string,
        gender: string,
        gym_id: string,
        password: string
    }
}

export const createAdmin = async (req: CreateAdminRequest, res: Response) => {
    const { name, email, phone, gender, gym_id, password } = req.body;

    logger.info(req.body, { structuredData: true })

    try {
        // Create the user with the given properties and set custom claims
        const properties = {
            displayName: name,
            phoneNumber: "+91" + phone,
            email,
            password,
            emailVerified: true,
        }

        const userRecord = await admin.auth().createUser(properties);

        await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true, gym_id });

        // Store the admin's information in Firestore
        const adminData = {
            name,
            email,
            phone,
            gender,
            createdAt: FieldValue.serverTimestamp(),
            gym_id: gym_id.toLowerCase().trim(),
            userId: userRecord.uid,
        }

        await admin.firestore()
            .collection("gyms")
            .doc(gym_id)
            .collection("admins")
            .doc(userRecord.uid)
            .set(adminData);

        logger.info(`Admin created successfully uid: ${userRecord.uid} name: ${name}`, { structuredData: true });

        // Return the created user record
        res.status(201).json({ user: userRecord.toJSON() });
    } catch (err: any) {
        res.status(400).send(err);
    }
};