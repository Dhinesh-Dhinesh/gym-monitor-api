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

/**
 * Creates a new admin user for the given gym.
 *
 * @param req.body - The request body must contain the following properties:
 *   - `name`: The name of the admin.
 *   - `email`: The email of the admin.
 *   - `phone`: The phone number of the admin.
 *   - `gender`: The gender of the admin.
 *   - `gym_id`: The ID of the gym to which the admin belongs.
 *   - `password`: The password of the admin.
 *
 * @returns A promise that resolves to a JSON response containing the newly
 *   created admin's ID if the admin is created successfully, or a JSON response
 *   containing an error message if the admin already exists or if an error occurs.
 */
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

/**
 * Creates a new plan for the given gym.
 *
 * @param req.body - The request body must contain the following properties:
 *   - `name`: The name of the plan.
 *   - `price`: The price of the plan.
 *   - `months`: The number of months the plan is valid for.
 *   - `gym_id`: The ID of the gym to which the plan belongs.
 *
 * @returns A promise that resolves to a JSON response containing the newly
 *   created plan's ID if the plan is created successfully, or a JSON response
 *   containing an error message if the plan already exists or if an error occurs.
 */
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

type MemberBody = {
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

type MemberData = MemberBody & {
    createdAt: FieldValue;
    userId: string;
}

type AddMember = {
    body: MemberBody;
};

/**
 * Creates a new member for the given gym.
 *
 * @param req.body - The request body must contain the following properties:
 *   - `name`: The name of the member.
 *   - `email`: The email of the member.
 *   - `phone`: The phone number of the member.
 *   - `gender`: The gender of the member.
 *   - `dob`: The date of birth of the member.
 *   - `address`: The address of the member.
 *   - `joinedAt`: The date the member joined the gym.
 *   - `planId`: The ID of the plan the member has subscribed to.
 *   - `gym_id`: The ID of the gym to which the member belongs.
 *   - `paidAmount`: The amount the member has paid.
 *   - `trainingType`: The type of training the member is subscribed to.
 *   - `createdBy`: The ID of the user who created the member.
 *
 * @returns A promise that resolves to a JSON response containing the newly
 *   created member's ID if the member is created successfully, or a JSON response
 *   containing an error message if the member already exists or if an error occurs.
 */
export const addMember = async (req: AddMember, res: Response) => {
    const {
        name,
        gender,
        dob,
        email,
        phone,
        joinedAt,
        address,
        notes,
        planId,
        gym_id,
        paidAmount,
        trainingType,
        createdBy
    } = req.body;

    try {
        const userProperties = {
            displayName: name,
            phoneNumber: `+91${phone}`,
            email,
            password: '12345678',
            emailVerified: true,
        };

        const userRecord = await admin.auth().createUser(userProperties);

        const memberData: MemberData = {
            name,
            email,
            phone,
            gender,
            joinedAt,
            address,
            dob,
            createdAt: FieldValue.serverTimestamp(),
            gym_id: gym_id.toLowerCase().trim(),
            planId,
            paidAmount,
            trainingType,
            userId: userRecord.uid,
            createdBy: createdBy.trim()
        };

        // Conditionally add the notes field if it is undefined or null
        if (notes) {
            memberData.notes = notes;
        }

        await admin
            .firestore()
            .collection('gyms')
            .doc(gym_id)
            .collection('users')
            .doc(userRecord.uid)
            .set(memberData);

        logger.info(`Member created successfully uid: ${userRecord.uid} name: ${name}`, { structuredData: true });

        // Return the created user record
        res.status(201).json({ user: userRecord.toJSON() });

    } catch (err: any) {
        res.status(400).send(err);
    }
};