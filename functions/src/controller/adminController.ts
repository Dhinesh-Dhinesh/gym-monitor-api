import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { FieldValue } from 'firebase-admin/firestore';
import { Response } from "express";
import { v4 as uuidv4 } from 'uuid';

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

type CreatePlan = {
    body: {
        name: string,
        price: number,
        months: number,
        gym_id: string,
    }
}

export const createPlan = async (req: CreatePlan, res: Response) => {
    const { name, price, months, gym_id } = req.body;

    try {
        // Reference to the 'plans' collection inside the gym document
        const plansRef = admin.firestore()
            .collection('gyms')
            .doc(gym_id)
            .collection('plans');

        // Check if a plan with the same price and months already exists
        const existingPlanQuery = await plansRef
            .where('price', '==', price)
            .where('months', '==', months)
            .get();

        if (!existingPlanQuery.empty) {
            // Plan already exists
            res.status(409).json({ message: 'Plan with this price and months already exists', error: "server/plan-already-exist" });
            return;
        }

        // Generate a UUID for the document ID
        const planId = uuidv4();

        // Reference to the new plan document
        const planRef = plansRef.doc(planId);

        // Add the new plan to the collection
        await planRef.set({
            name,
            price,
            months,
            createdAt: FieldValue.serverTimestamp(), // Optionally add a timestamp
        });

        // Return the newly created plan's ID
        res.status(201).json({ message: 'Plan created successfully', planId });
    } catch (error: any) {
        console.error('Error creating plan:', error);
        res.status(500).json({ message: 'Failed to create plan', error: error.message || error });
    }
}