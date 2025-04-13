// middlewares/authenticateFirebase.ts
import { Request, Response, NextFunction } from 'express';
import admin from '@/services/FirebaseAdmin_Service';

export const authenticateFirebase = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const idToken = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token', detail: (error as Error).message });
  }
};
