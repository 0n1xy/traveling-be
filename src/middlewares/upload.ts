// src/middlewares/upload.ts
import multer from 'multer';

export const uploadPostImg = multer({
  storage: multer.memoryStorage(),
});

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
}).single('avatar');