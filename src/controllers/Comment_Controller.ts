import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  Firestore,
} from "firebase/firestore";
import admin from "@/services/FirebaseAdmin_Service";

export const addComment = async (req: Request, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    const { content, createdBy } = req.body;

    if (!postId || !content || !createdBy?.uId || !createdBy?.username) {
      return res.status(400).json({ error: "Thiếu dữ liệu bình luận" });
    }

    const id = uuidv4();
    const newComment = {
      id,
      postId,
      content,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    await admin.firestore().collection("comments").doc(id).set(newComment);
    res.status(201).json(newComment);
  } catch (err) {
    console.error("❌ Error adding comment:", err);
    res.status(500).json({
      error: "Không thể thêm bình luận",
      detail: (err as any).message,
    });
  }
};

export const getCommentsByPostId = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const postId = req.params.postId;

    if (!postId) return res.status(400).json({ error: "Thiếu postId" });

    const snapshot = await admin
      .firestore()
      .collection("comments")
      .where("postId", "==", postId)
      .orderBy("createdAt", "desc")
      .get();

    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(comments);
  } catch (err) {
    console.error("❌ Error fetching comments:", err);
    res
      .status(500)
      .json({ error: "Không thể lấy bình luận", detail: (err as any).message });
  }
};

export const deleteComment = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const commentId = req.params.commentId;
    const uid = (req as any).user.uid;

    const commentRef = admin.firestore().collection("comments").doc(commentId);
    const commentSnap = await commentRef.get();

    if (!commentSnap.exists) {
      return res.status(404).json({ error: "Không tìm thấy comment" });
    }

    const comment = commentSnap.data();
    if (comment?.createdBy?.uId !== uid) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền xoá comment này" });
    }

    await commentRef.delete();
    res.status(200).json({ message: "Đã xoá bình luận" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Xoá thất bại", detail: (err as any).message });
  }
};
