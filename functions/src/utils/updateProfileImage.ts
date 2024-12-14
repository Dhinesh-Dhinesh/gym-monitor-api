import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { FormidableFile } from 'formidable-serverless';
import { getExtensionFromMimeType } from './getFileExtension';

const storage = new Storage();
const bucket = storage.bucket('gym-monitor.appspot.com');

interface ProfileImageUploadParams {
    profileImage: FormidableFile;
    gymId: string;
    userId: string;
}

interface ReturnType {
    error?: string;
    value?: string;
}

export const uploadProfileImage = async ({ profileImage, gymId, userId }: ProfileImageUploadParams): Promise<ReturnType> => {
    try {
        const token = uuidv4();

        if (!profileImage.size) {
            return { error: "No file uploaded." };
        }

        //^ Adjust the path of the bucket based on the environment
        // const downLoadPath = "http://localhost:9199/v0/b/gym-monitor.appspot.com/o/";
        const downLoadPath = "https://firebasestorage.googleapis.com/v0/b/gym-monitor.appspot.com/o/";

        // Get file extension
        const extension = getExtensionFromMimeType(profileImage.type);

        // Check if the extension is valid
        if (extension === 'octet-stream' || !extension) {
            return { error: "Invalid file type." };
        }

        const fileNameWithExtension = `profile.${extension}`;
        const destination = `gyms/${gymId}/members/${userId}/profile/${fileNameWithExtension}`;

        // Upload the file to Firebase Storage
        await bucket.upload(profileImage.path, {
            destination,
            metadata: {
                metadata: {
                    firebaseStorageDownloadTokens: token,
                },
            },
        });

        // Generate a public URL
        const imageUrl = `${downLoadPath}${encodeURIComponent(destination)}?alt=media&token=${token}`;

        // Return success with the image URL
        return { value: imageUrl };

    } catch (error) {
        console.error("Error uploading profile image:", error);
        return { error: "ERROR_UPLOADING_PROFILE_IMAGE" }; // Return error if anything goes wrong
    }
};
