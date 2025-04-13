import { Request, Response } from 'express';
import admin from '@/services/FirebaseAdmin_Service';
import { uploadAvt } from '@/services/S3_Service'; 
const firestore = admin.firestore();


export const getCurrentUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const uid = (req as any).user.uid;
        const userRef = firestore.collection('users').doc(uid);
        const snapshot = await userRef.get();

        if (!snapshot.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ id: uid, ...snapshot.data() });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info', detail: (error as Error).message });
    }
};

export const updateCurrentUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const uid = (req as any).user.uid;

        if (!req.body) {
            return res.status(400).json({ error: 'Missing body data' });
        }

        const {
            fullName,
            dob,
            phoneNumber,
            bio,
            hometown,
            travelStyle,
            countriesVisited,
        } = req.body;

        let avatarUrl = req.body.avatarUrl || '';

        // ✅ Nếu có file avatar thì upload lên S3
        const file = req.file;
        if (file) {
            avatarUrl = await uploadAvt(file);
        }

        const updateData = {
            fullName,
            dob: dob || null,
            phoneNumber: phoneNumber || null,
            bio: bio || '',
            hometown: hometown || '',
            avatarUrl,
            travelStyle: travelStyle || '',
            countriesVisited: Number(countriesVisited) || 0,
        };

        const userRef = firestore.collection('users').doc(uid);
        await userRef.update(updateData);

        res.status(200).json({
            message: 'User updated successfully',
            updated: updateData,
        });
    } catch (error) {
        console.error('❌ Update user error:', error);
        res.status(500).json({
            error: 'Failed to update user',
            detail: (error as Error).message,
        });
    }
};
