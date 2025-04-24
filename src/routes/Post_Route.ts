import express from "express";
import {
  createTravelPost,
  getAllTravelPosts,
  getTravelPostById,
  updateTravelPost,
  deleteTravelPost,
  getPostByUID,
  getUserFavorites,
  getAllLikedUserIds,
  toggleFavorite,
  toggleLike,
  clonePost,
  getUserGallery,
  getUserLikedPosts,
} from "@/controllers/Post_Controller";
import { uploadPostImg } from "@/middlewares/upload";
import { authenticateFirebase } from "@/middlewares/authenticateFirebase_Middleware";

const router = express.Router();
router.get("/favorites", authenticateFirebase, getUserFavorites);
router.get("/liked", authenticateFirebase, getUserLikedPosts);
router.get("/gallery/:id", authenticateFirebase, getUserGallery);
router.post(
  "/",
  authenticateFirebase,
  uploadPostImg.array("images", 10),
  createTravelPost
);
router.post("/:id/favorite", authenticateFirebase, toggleFavorite);
router.post("/:id/like", authenticateFirebase, toggleLike);
router.post("/clone", authenticateFirebase, clonePost);
router.get("/liked-users ", authenticateFirebase, getAllLikedUserIds);
router.get("/", authenticateFirebase, getAllTravelPosts);
router.get("/mine", authenticateFirebase, getPostByUID);
router.get("/:id", authenticateFirebase, getTravelPostById);
router.put(
  "/:id",
  authenticateFirebase,
  uploadPostImg.array("images", 10),
  updateTravelPost
);
router.delete("/:id", authenticateFirebase, deleteTravelPost);

export default router;
