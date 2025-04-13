import { Request, Response } from 'express';
import axios from 'axios';
import { db } from '@/services/Firebase_Service';
import admin from '@/services/FirebaseAdmin_Service';
import bcrypt from 'bcrypt';
import { collection, addDoc } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

export const loginWithEmailPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { idToken, refreshToken, localId, email: userEmail } = response.data;
    
    res.json({
      uid: localId,
      email: userEmail,
      idToken,
      refreshToken, // 👈 Thêm dòng này để gửi về cho mobile
    });
  } catch (error: any) {
    const firebaseError = error.response?.data?.error?.message;

    let message = 'Login failed';
    let statusCode = 401;

    switch (firebaseError) {
      case 'EMAIL_NOT_FOUND':
        message = 'Email không tồn tại';
        break;
      case 'INVALID_PASSWORD':
        message = 'Mật khẩu không đúng';
        break;
      case 'USER_DISABLED':
        message = 'Tài khoản đã bị vô hiệu hóa';
        break;
      default:
        message = 'Lỗi không xác định';
        statusCode = 500;
        break;
    }

    console.error('Login error:', firebaseError || error.message);
    res.status(statusCode).json({
      error: message,
      code: firebaseError,
    });
  }
};


export const registerUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, email, password, dob = null, phoneNumber = null } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Tạo tài khoản Firebase
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });

    // 2. Băm password nếu cần
    //   const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Ghi vào Firestore bằng Admin SDK (bỏ qua security rules)
    const userData = {
      fullName,
      email,
      password: password,
      dob,
      phoneNumber,
    };

    const userRef = admin.firestore().doc(`users/${userRecord.uid}`);
    await userRef.set(userData);

    res.status(201).json({
      message: 'User registered successfully',
      uid: userRecord.uid,
      docId: userRecord.uid,
      user: { ...userData, id: userRecord.uid },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed', detail: error.message });
  }
};

export const refreshFirebaseToken = async (req: Request, res: Response): Promise<any> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Missing refreshToken' });
  }

  try {
    const response = await axios.post(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      })
    );

    const {
      id_token,
      refresh_token,
      expires_in,
      user_id,
    } = response.data;

    return res.status(200).json({
      idToken: id_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      uid: user_id,
    });
  } catch (error: any) {
    console.error("❌ Refresh token failed:", error.response?.data || error.message);
    return res.status(401).json({
      error: 'Invalid refresh token',
      detail: error.response?.data?.error || error.message,
    });
  }
};