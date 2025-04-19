import {
  addComment,
  deleteComment,
  getCommentsByPostId,
} from "@/controllers/Comment_Controller";
import { authenticateFirebase } from "@/middlewares/authenticateFirebase_Middleware";
import express from "express";

const router = express.Router();

router.post("/comment/:postId", addComment);
router.get("/comments/:postId", getCommentsByPostId);
router.delete("/comments/:commentId", authenticateFirebase, deleteComment);

export default router;
