import { Timestamp } from 'firebase-admin/firestore';
import { addMonths } from 'date-fns';

// Function to add months to a Firebase Timestamp
export const addMonthsToFirebaseTimestamp = (timestamp: Timestamp, months: number): Timestamp => {
    // Convert Firebase Timestamp to JavaScript Date
    const date = timestamp.toDate();

    // Add months using date-fns
    const newDate = addMonths(date, months);

    // Convert the new date back to Firebase Timestamp
    return Timestamp.fromDate(newDate);
};