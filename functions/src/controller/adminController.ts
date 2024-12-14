import * as logger from "firebase-functions/logger";
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Response } from "express";
import { v4 as uuidv4 } from 'uuid';
import { addMonthsToFirebaseTimestamp } from "../utils/dateTimeFns";
import admin from "../utils/firebase";
import { Files } from "formidable-serverless";
import { uploadProfileImage } from "../utils/updateProfileImage";

const db = admin.firestore();
const auth = admin.auth();

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
    dob: Timestamp;
    address: string;
    phone: string;
    profilePicUrl: string | null;
    trainingType: 'general' | 'personal';
    joinedAt: Timestamp;
    notes?: string;
    gym_id: string;
    createdBy: string;
};

type MemberData = MemberBody & {
    totalToBePaid: number;
    totalPaid: number;
    totalDue: number;
    createdAt: FieldValue;
    expiresAt: Timestamp;
    userId: string;
}

type createMember = {
    body: MemberBody & {
        plan: {
            name: string,
            months: number,
            price: number,
            paidAmount: number
        }
    };
};

type MemberPlan = {
    name: string,
    months: number,
    price: number,
    paid: number,
    due: number,
    purchasedAt: Timestamp,
    expiresAt: Timestamp,
    gym_id: string,
}

type PaymentHistory = {
    paidAmount: number
    date: Timestamp
    addedBy: string
}


/**
 * Creates a new member user for the given gym.
 *
 * @param req.body - The request body must contain the following properties:
 *   - `name`: The name of the member.
 *   - `email`: The email of the member.
 *   - `phone`: The phone number of the member.
 *   - `gender`: The gender of the member.
 *   - `dob`: The date of birth of the member.
 *   - `address`: The address of the member.
 *   - `joinedAt`: The date the member joined the gym.
 *   - `notes`: The notes about the member.
 *   - `gym_id`: The ID of the gym to which the member belongs.
 *   - `trainingType`: The type of training the member is subscribed to.
 *   - `createdBy`: The ID of the user who created the member.
 *   - `plan`: The plan details of the member.
 *
 * @returns A promise that resolves to a JSON response containing the newly
 *   created member's ID if the member is created successfully, or a JSON response
 *   containing an error message if the member already exists or if an error occurs.
 */
export const createMember = async (req: createMember, res: Response) => {
    const {
        name,
        gender,
        dob,
        email,
        phone,
        joinedAt,
        address,
        notes,
        gym_id,
        trainingType,
        createdBy,
        plan,
        profilePicUrl
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

        //!FIX : Need to set custom claims for the user

        const due = plan.price - plan.paidAmount;

        // Convert { nano, seconds } to Firestore Timestamp
        const dobTimestamp = new Timestamp(dob.seconds, dob.nanoseconds);
        const joinedAtTimestamp = new Timestamp(joinedAt.seconds, joinedAt.nanoseconds);


        const memberData: MemberData = {
            name,
            email,
            phone,
            profilePicUrl,
            gender,
            trainingType,
            address,
            dob: dobTimestamp,
            totalToBePaid: plan.price,
            totalPaid: plan.paidAmount,
            totalDue: due,
            joinedAt: joinedAtTimestamp,
            expiresAt: addMonthsToFirebaseTimestamp(joinedAtTimestamp, plan.months),
            createdAt: FieldValue.serverTimestamp(),
            gym_id: gym_id.toLowerCase().trim(),
            userId: userRecord.uid,
            createdBy: createdBy.trim()
        };

        // Conditionally add the notes field if it is undefined or null
        if (notes) {
            memberData.notes = notes;
        }

        // set user data on firestore
        await admin
            .firestore()
            .collection('gyms')
            .doc(gym_id)
            .collection('users')
            .doc(userRecord.uid)
            .set(memberData);

        // set the plan data on firestore
        const planData: MemberPlan = {
            name: plan.name,
            months: plan.months,
            price: plan.price,
            paid: plan.paidAmount,
            due,
            purchasedAt: joinedAtTimestamp,
            expiresAt: addMonthsToFirebaseTimestamp(joinedAtTimestamp, plan.months),
            gym_id: gym_id,
        };

        const plansRef = admin
            .firestore()
            .collection('gyms')
            .doc(gym_id)
            .collection('users')
            .doc(userRecord.uid)
            .collection('plan');

        // Add the plan and get the document reference
        const planDocRef = await plansRef.add(planData);

        // Retrieve the plan document ID
        const planId = planDocRef.id;

        // set the payment history on firestore
        const paymentHistory: PaymentHistory = {
            paidAmount: plan.paidAmount,
            date: Timestamp.now(),
            addedBy: createdBy
        };

        const paymentHistoryRef = admin
            .firestore()
            .collection('gyms')
            .doc(gym_id)
            .collection('users')
            .doc(userRecord.uid)
            .collection('plan')
            .doc(planId)
            .collection('paymentHistory');

        await paymentHistoryRef.add(paymentHistory);

        logger.info(`Member created successfully uid: ${userRecord.uid} name: ${name}`, { structuredData: true });

        // Return the created user record
        res.status(201).json({ user: userRecord.toJSON() });

    } catch (err: any) {
        res.status(400).send(err);
    }
};


type updateMember = {
    params: {
        gymId: string,
        userId: string
    },
    body: {
        name?: string,
        email?: string,
        phone?: string,
        gender?: string,
        dob?: string | Timestamp,
        trainingType?: string,
        address?: string,
        notes?: string,
    },
    files?: Files
}

/**
 * Updates a user in a gym.
 *
 * @param req.params - The request query must contain the following properties:
 *   - `gymId`: The ID of the gym to which the user belongs.
 *   - `userId`: The ID of the user to be updated.
 *
 * @param req.body - The request body must contain the fields to be updated.
 *   - `name`: The name of the user.
 *   - `email`: The email of the user.
 *   - `phone`: The phone number of the user.
 *   - `gender`: The gender of the user.
 *   - `dob`: The date of birth of the user.
 *   - `joinedAt`: The date when the user joined the gym.
 *   - `address`: The address of the user.
 *   - `trainingType`: The training type of the user.
 *   - `notes`: The notes for the user.
 * @param req.files - The request files contain the profile picture of the user.
 *
 * @returns A promise that resolves to a JSON response containing a success
 *   message if the user is updated successfully, or a JSON response containing
 *   an error message if the user is not updated successfully.
 */
export const updateMember = async (req: updateMember, res: Response) => {
    const { gymId, userId } = req.params;
    const {
        name,
        email,
        phone,
        gender,
        dob,
        trainingType,
        address,
        notes,
    } = req.body;

    try {

        if (!gymId || !userId) {
            res.status(400).json({ message: "Gym ID and User ID are required" });
            return;
        }

        // Object to hold the updated data
        const authUpdateData: admin.auth.UpdateRequest = {};
        const updateData: Partial<updateMember['body']> & { profilePicUrl?: string, lastUpdated?: Timestamp } = {};

        // Check if the user exists
        const userRef = db.doc(`gyms/${gymId}/users/${userId}`);
        const userSnapshot = await userRef.get();

        // If the user doesn't exist, return an error
        if (!userSnapshot.exists) {
            res.status(404).json({ message: "User not found." });
            return;
        }

        // Upload profile image if provided
        const profileImage = req?.files?.profilePicUrl;
        if (profileImage) {
            const { error, value } = await uploadProfileImage({ profileImage, gymId, userId });

            if (error) {
                res.status(400).json({ message: error });
                return;
            }

            // Add profile image URL to update data
            updateData.profilePicUrl = value;
        }

        // Check if there is data to update
        if (name) {
            updateData.name = name;
            authUpdateData.displayName = name.trim();
        }
        if (email) {
            updateData.email = email;
            authUpdateData.email = email.trim();
            authUpdateData.emailVerified = true;
        }
        if (phone) {
            updateData.phone = phone;
            authUpdateData.phoneNumber = '+91' + phone;
        }
        if (gender) updateData.gender = gender;
        if (dob) updateData.dob = Timestamp.fromDate(new Date(dob as string));
        if (trainingType) updateData.trainingType = trainingType;
        if (address) updateData.address = address;
        if (notes) updateData.notes = notes;

        // Update Firestore Document if there is data to update
        if (Object.keys(updateData).length > 0) {
            updateData.lastUpdated = Timestamp.now();
            await userRef.update(updateData);
        }

        // Update Firebase Auth Profile if there is data to update
        if (Object.keys(authUpdateData).length > 0) {
            await auth.updateUser(userId, authUpdateData);
        }

        // Check if any update data is present
        const noUpdateData = Object.keys(authUpdateData).length === 0 && Object.keys(updateData).length === 0;

        if (noUpdateData) {
            res.status(400).send({ message: "No changes detected. Please provide data to update." });
            return;
        }

        logger.info(`Member updated successfully uid: ${userId}`, { structuredData: true });

        res.status(200).send({ message: "MEMBER_UPDATED", updatedData: updateData });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send({ message: "Failed to update user.", error });
    }
}

export type AddPayment = {
    body: {
        meta: {
            gymId: string,
            userId: string,
            planId: string,
        },
        data: {
            date: Timestamp,
            amount: number,
            addedBy: string
        }
    }
}

/**
 * Adds a payment to a user's plan in a gym.
 *
 * @param req.body - The request body must contain the following properties:
 *    - `meta`: An object with the following properties:
 *     - `gymId`: The ID of the gym to which the user belongs.
 *     - `userId`: The ID of the user to which the payment belongs.
 *     - `planId`: The ID of the plan to which the payment belongs.
 *    - `data`: An object with the following properties:
 *     - `date`: The date of the payment in seconds and nanoseconds.
 *     - `amount`: The amount of the payment.
 *     - `addedBy`: The ID of the user who made the payment.
 *
 * @returns A promise that resolves to a JSON response containing the newly
 *   created payment's ID and the payment data if the payment is created
 *   successfully, or a JSON response containing an error message if the
 *   payment is not created successfully.
 */
export const addPayment = async (req: AddPayment, res: Response) => {
    // Extract data from the request body
    const { gymId, userId, planId } = req.body.meta;
    const { date, amount, addedBy } = req.body.data;

    const db = admin.firestore();

    // Step 1: Create references for user, plan, and payment collection in Firestore
    const userDocRef = db.doc(`gyms/${gymId}/users/${userId}`);
    const planDocRef = db.doc(`gyms/${gymId}/users/${userId}/plan/${planId}`);
    const paymentsCollectionRef = db.collection(`gyms/${gymId}/users/${userId}/plan/${planId}/paymentHistory`);

    let newPaymentData = {};
    let paymentId = '';

    // Step 2: Run Firestore transaction for atomic operations
    try {
        // Using the transaction to perform multiple operations atomically
        await db.runTransaction(async (t) => {
            // Step 3: Retrieve user and plan documents
            const userDoc = await t.get(userDocRef);
            const planDoc = await t.get(planDocRef);

            const planDocData = planDoc.data();
            const userDocData = userDoc.data();

            // Step 4: Check if the documents exist
            if (
                !planDocData ||
                planDocData.paid === undefined ||
                planDocData.due === undefined ||
                !userDocData ||
                userDocData.totalPaid === undefined ||
                userDocData.totalDue === undefined
            ) {
                throw new Error("MISSING_REQUIRED_FIELDS_OR_DOCUMENT_NOT_FOUND");
            }
            // Step 5: Validate that the payment amount does not exceed the plan's due amount
            if (amount > planDocData.due) {
                throw new Error("AMOUNT_CANNOT_BE_GREATER_THAN_DUE");
            }

            // Step 6: Calculate and update `totalPaid` and `totalDue` in the user document
            const newTotalPaid = userDocData.totalPaid + amount;
            const newTotalDue = userDocData.totalDue - amount;
            t.update(userDocRef, { totalPaid: newTotalPaid, totalDue: newTotalDue });

            // Step 7: Calculate and update `paidAmount` and `due` in the plan document
            const newPaidAmount = planDocData.paid + amount;
            const newPlanDue = planDocData.due - amount;
            t.update(planDocRef, { paid: newPaidAmount, due: newPlanDue });

            // Step 8: Add a new payment entry to the payments subcollection
            const newPaymentRef = paymentsCollectionRef.doc(); // auto-generated ID
            const dateTimeStamp = new Timestamp(date.seconds, date.nanoseconds);

            paymentId = newPaymentRef.id;

            newPaymentData = {
                addedBy: addedBy.trim(),
                date: dateTimeStamp,
                paidAmount: amount,
            };

            t.set(newPaymentRef, newPaymentData);
        });

        // Step 9: If transaction is successful, send response
        res.status(200).json({ message: "Payment added successfully", data: { id: paymentId, ...newPaymentData, userId, planId } });
    } catch (error) {
        // Step 10: Handle transaction failure
        res.status(400).json({ message: "Error adding payment", error: error instanceof Error ? error.message : "UNKNOWN_ERROR" });
    }
};

type DeletePayment = {
    body: {
        gymId: string;
        userId: string;
        planId: string;
        paymentId: string;
    }
}

/**
 * Deletes a payment from a user's plan in a gym.
 *
 * @param req.body - The request body must contain the following properties:
 *    - `gymId`: The ID of the gym to which the user belongs.
 *    - `userId`: The ID of the user to which the payment belongs.
 *    - `planId`: The ID of the plan to which the payment belongs.
 *    - `paymentId`: The ID of the payment to be deleted.
 *
 * @returns A promise that resolves to a JSON response containing a success
 *   message if the payment is deleted successfully, or a JSON response
 *   containing an error message if the payment is not deleted successfully.
 */
export const deletePayment = async (req: DeletePayment, res: Response) => {
    const { gymId, userId, planId, paymentId } = req.body;

    const db = admin.firestore();

    //create it as a transaction before delete update totalPaid and totalDue and plan due and paid

    const userDocRef = db.doc(`gyms/${gymId}/users/${userId}`);
    const planDocRef = db.doc(`gyms/${gymId}/users/${userId}/plan/${planId}`);
    const paymentDocRef = db.doc(`gyms/${gymId}/users/${userId}/plan/${planId}/paymentHistory/${paymentId}`);

    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userDocRef);
            const planDoc = await t.get(planDocRef);
            const paymentDoc = await t.get(paymentDocRef);

            const userDocData = userDoc.data();
            const planDocData = planDoc.data();
            const paymentDocData = paymentDoc.data();

            if (!userDocData || typeof userDocData.totalPaid !== 'number' || typeof userDocData.totalDue !== 'number') {
                throw new Error("User document is missing required fields: totalPaid or totalDue.");
            }

            if (!planDocData || typeof planDocData.paid !== 'number' || typeof planDocData.due !== 'number') {
                throw new Error("Plan document is missing required fields: paid or due.");
            }

            if (!paymentDocData || typeof paymentDocData.paidAmount !== 'number') {
                throw new Error("Payment document is missing the required field: paidAmount.");
            }

            const paidAmount = paymentDocData.paidAmount;

            t.update(userDocRef, {
                totalPaid: userDocData.totalPaid - paidAmount,
                totalDue: userDocData.totalDue + paidAmount
            });

            t.update(planDocRef, {
                paid: planDocData.paid - paidAmount,
                due: planDocData.due + paidAmount
            });

            t.delete(paymentDocRef);

        });

        res.status(200).json({ message: "Payment deleted successfully" });

    } catch (error) {
        res.status(400).json({ message: "Error deleting payment", error: error instanceof Error ? error.message : "UNKNOWN_ERROR" });
    }
}