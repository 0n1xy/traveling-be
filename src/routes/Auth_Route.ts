import express from 'express';
import { loginWithEmailPassword, refreshFirebaseToken, registerUser } from '@/controllers/Auth_Controller';

const router = express.Router();
router.post('/login', loginWithEmailPassword);
router.post('/register', registerUser);
router.post('/refresh-token', refreshFirebaseToken);

export default router;