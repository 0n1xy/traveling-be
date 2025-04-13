// routes/UserRoute.ts
import express from 'express';
import { getCurrentUser, updateCurrentUser } from '@/controllers/User_Controller';
import { authenticateFirebase } from '@/middlewares/authenticateFirebase_Middleware';
import { uploadAvatar } from '@/middlewares/upload';

const router = express.Router();

router.get('/me', authenticateFirebase, getCurrentUser);
router.put('/me', authenticateFirebase, uploadAvatar, updateCurrentUser);

export default router;
