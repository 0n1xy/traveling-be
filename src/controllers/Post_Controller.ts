import { Request, Response } from "express";
import { db } from "@/services/Firebase_Service";
import { ITravelPost } from "@/models/Post_Model";
import { v4 as uuidv4 } from "uuid";
import { deleteImage, uploadToS3 } from "@/services/S3_Service";
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

const collectionRef = collection(db, "tripPost");

export const createTravelPost = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const files = req.files as Express.Multer.File[];
    const { postData } = req.body;

    if (!postData) {
      return res.status(400).json({ error: "Thiếu postData" });
    }

    // ✅ Parse toàn bộ postData
    let parsed;
    try {
      parsed = JSON.parse(postData);
    } catch (err) {
      return res
        .status(400)
        .json({ error: "postData không phải là JSON hợp lệ" });
    }

    const {
      title,
      description,
      location,
      isPublic,
      createdBy,
      activities,
      createdAt,
    } = parsed;

    // ✅ Validate createdBy object và lấy uid
    if (
      !createdBy ||
      typeof createdBy !== "object" ||
      typeof createdBy.uId !== "string" ||
      createdBy.uId.trim() === ""
    ) {
      return res
        .status(400)
        .json({ error: "Thiếu hoặc sai định dạng createdBy.uId" });
    }

    const userId = createdBy.uId;

    // ❗ Kiểm tra file ảnh
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // ✅ Upload ảnh lên S3
    const imageUrls = await Promise.all(
      files.map(async (file) => {
        console.log("Uploading:", file.originalname);
        return await uploadToS3(file);
      })
    );

    // ✅ Tạo ID mới
    const id = uuidv4();
    console.log("🆔 ID sinh ra:", id);

    // ✅ Tạo object post
    const post: ITravelPost = {
      id,
      title,
      description,
      location,
      imageUrls,
      likes: [],
      isPublic,
      createdAt: createdAt || new Date().toISOString(),
      createdBy, // vẫn giữ object để hiển thị avatar, username
      activities,
    };

    // ✅ Ghi vào Firestore
    await admin.firestore().collection("tripPost").doc(id).set(post);

    // ✅ Lưu ảnh vào gallery theo userId
    const galleryRef = admin.firestore().collection("gallery").doc(userId);
    const gallerySnap = await galleryRef.get();

    if (gallerySnap.exists) {
      await galleryRef.update({
        imageURLs: admin.firestore.FieldValue.arrayUnion(...imageUrls),
      });
    } else {
      await galleryRef.set({
        userId,
        imageURLs: imageUrls,
      });
    }

    return res.status(201).json(post);
  } catch (err: any) {
    console.error("❌ Create Post Error:", err);
    return res.status(500).json({
      error: "Failed to create post",
      detail: err.message,
    });
  }
};

export const getAllTravelPosts = async (req: Request, res: Response) => {
  try {
    const currentUid = (req as any).user.uid;

    const snapshot = await admin.firestore().collection("tripPost").get();
    const allPosts = snapshot.docs.map((doc) => {
      const data = doc.data() as {
        isPublic?: boolean;
        createdBy?: { uId: string };
        createdAt?: string;
        [key: string]: any;
      };
      return {
        id: doc.id,
        ...data,
      };
    });

    const publicPosts = allPosts.filter(
      (post) =>
        (post.isPublic as boolean) !== false &&
        (post.createdBy as any)?.uId !== currentUid
    );

    const sorted = publicPosts.sort((a: any, b: any) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );

    res.status(200).json(sorted);
  } catch (err: any) {
    console.error("❌ Failed to get posts:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch posts", detail: err.message });
  }
};

// ✅ Lấy bài viết theo ID
export const getTravelPostById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const docSnap = await admin
      .firestore()
      .collection("tripPost")
      .doc(req.params.id)
      .get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({
      id: docSnap.id,
      ...docSnap.data(),
    });
  } catch (err) {
    console.error("❌ Error fetching post:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch post", detail: (err as any).message });
  }
};

// ✅ Cập nhật bài viết
export const updateTravelPost = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const docRef = doc(collectionRef, id);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }

    const currentData = existing.data();
    const currentImages: string[] = currentData?.imageUrls || [];

    // 🧩 Parse postData nếu là multipart/form-data
    const parsed = req.body.postData ? JSON.parse(req.body.postData) : req.body;

    // 🖼️ Upload ảnh mới nếu có file
    const newFiles = (req.files as Express.Multer.File[]) || [];
    const newUploadedUrls: string[] = await Promise.all(
      newFiles.map((file) => uploadToS3(file))
    );

    // 📌 Ảnh cũ giữ lại từ client
    const keptImageUrls: string[] = parsed.imageUrls || [];

    // ❌ Xoá ảnh cũ không còn được giữ
    const toBeDeleted = currentImages.filter(
      (url) => !keptImageUrls.includes(url)
    );
    for (const url of toBeDeleted) {
      await deleteImage(url);
    }

    // 🧩 Gộp ảnh giữ lại và ảnh mới upload
    const finalImageUrls = [...keptImageUrls, ...newUploadedUrls];

    // ✅ Update dữ liệu
    const updatedData = {
      ...parsed,
      imageUrls: finalImageUrls,
    };

    await updateDoc(docRef, updatedData);

    const updatedSnap = await getDoc(docRef);
    return res.status(200).json({
      id: updatedSnap.id,
      ...updatedSnap.data(),
    });
  } catch (err: any) {
    console.error("❌ Failed to update post:", err);
    return res
      .status(500)
      .json({ error: "Failed to update post", detail: err.message });
  }
};

// ✅ Xoá bài viết
export const deleteTravelPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteDoc(doc(collectionRef, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post", detail: err });
  }
};

export const getPostByUID = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    console.log("🔍 UID lấy từ token:", uid); // <-- Thêm dòng này

    const snapshot = await admin
      .firestore()
      .collection("tripPost")
      .where("createdBy.uId", "==", uid)
      .get();

    console.log("📦 Documents trả về:", snapshot.size);

    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(posts);
  } catch (error) {
    console.error("❌ Error fetching trip posts:", error);
    res.status(500).json({ message: "Failed to fetch trip posts" });
  }
};

export const getUserFavorites = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const uid = req.query.uid as string;
    if (!uid) return res.status(400).json({ error: "UID is required" });

    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    const favoriteRef = admin.firestore().collection("favorites").doc(uid);
    const favoriteSnap = await favoriteRef.get();

    if (!favoriteSnap.exists) {
      console.log("ℹ️ No favorites document found for user");
      return res.status(200).json([]);
    }

    const favoritesData = favoriteSnap.data();
    const postIds = favoritesData?.postId || favoritesData?.posts || []; // Check alternative field names

    if (!Array.isArray(postIds)) {
      console.warn("⚠️ Post IDs is not an array:", postIds);
      return res.status(200).json([]);
    }

    console.log("🔍 Post IDs to fetch:", postIds);

    const posts = await Promise.all(
      postIds.map(async (id) => {
        if (!id) return null;
        try {
          const doc = await admin
            .firestore()
            .collection("tripPost")
            .doc(id)
            .get();
          return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (err) {
          console.error(`❌ Error fetching post ${id}:`, err);
          return null;
        }
      })
    );

    const validPosts = posts.filter(Boolean);

    return res.status(200).json(validPosts);
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getAllLikedUserIds = async (_req: Request, res: Response) => {
  try {
    const snapshot = await admin.firestore().collection("tripPost").get();
    const allUids = new Set<string>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const likes: string[] = data.likes || [];
      likes.forEach((uid) => allUids.add(uid));
    });

    res.status(200).json(Array.from(allUids));
  } catch (err: any) {
    console.error("❌ Error getAllLikedUserIds:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch liked user ids", detail: err.message });
  }
};

export const toggleLike = async (req: Request, res: Response): Promise<any> => {
  try {
    const uid = (req as any).user.uid;
    const postId = req.params.id;
    const postRef = admin.firestore().collection("tripPost").doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists)
      return res.status(404).json({ error: "Post not found" });

    const post = postSnap.data();
    const alreadyLiked = (post?.likes || []).includes(uid);

    await postRef.update({
      likes:
        admin.firestore.FieldValue[alreadyLiked ? "arrayRemove" : "arrayUnion"](
          uid
        ),
    });

    res.status(200).json({ message: alreadyLiked ? "Unliked" : "Liked" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to toggle like", detail: (err as any).message });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const postId = req.params.id;

    const favoriteRef = admin.firestore().collection("favorites").doc(uid);
    const favoriteSnap = await favoriteRef.get();
    let alreadyFavorited = false;

    if (favoriteSnap.exists) {
      const data = favoriteSnap.data();
      alreadyFavorited = (data?.postId || []).includes(postId);

      await favoriteRef.update({
        postId:
          admin.firestore.FieldValue[
            alreadyFavorited ? "arrayRemove" : "arrayUnion"
          ](postId),
      });
    } else {
      await favoriteRef.set({
        userId: uid,
        postId: [postId],
      });
    }

    res
      .status(200)
      .json({ message: alreadyFavorited ? "Unfavorited" : "Favorited" });
  } catch (err) {
    res.status(500).json({
      error: "Failed to toggle favorite",
      detail: (err as any).message,
    });
  }
};

export const clonePost = async (req: Request, res: Response): Promise<any> => {
  try {
    const postData = req.body;

    if (!postData || !postData.createdBy || !postData.title) {
      return res.status(400).json({ error: "Thiếu dữ liệu clone post" });
    }

    const id = uuidv4();
    const newPostRef = admin.firestore().collection("tripPost").doc(id);

    await newPostRef.set({
      ...postData,
      id, // ✅ thêm ID giống như createTravelPost
      createdAt: new Date().toISOString(),
      likes: [],
      isPublic: false,
      isFavorite: true,
    });

    return res.status(201).json({
      message: "Clone thành công",
      id,
    });
  } catch (error: any) {
    console.error("❌ Lỗi clone post:", error);
    return res.status(500).json({
      error: "Không thể clone bài viết",
      detail: error.message,
    });
  }
};

export const getUserGallery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id: uId } = req.params; // ✅ Đổi tên lại đúng

    if (!uId || typeof uId !== "string" || uId.trim() === "") {
      return res.status(400).json({ error: "Thiếu hoặc sai định dạng uId" });
    }

    const galleryRef = admin.firestore().collection("gallery").doc(uId);
    const docSnap = await galleryRef.get();

    if (!docSnap.exists) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy gallery của người dùng" });
    }

    const data = docSnap.data();
    return res.status(200).json({
      userId: data?.userId || uId,
      imageURLs: data?.imageURLs || [],
    });
  } catch (error: any) {
    console.error("❌ Lỗi lấy gallery:", error);
    return res.status(500).json({
      error: "Lỗi server khi lấy gallery",
      detail: error.message,
    });
  }
};
