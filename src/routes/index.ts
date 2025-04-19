import express from "express";

import Post from "@/routes/Post_Route";
import Auth from "@/routes/Auth_Route";
import User from "@/routes/User_Route";
import Comment from "@/routes/Comment_Route";

export const routes = (app: express.Router) => {
  app.use("/api/post/", Post);
  app.use("/api/auth/", Auth);
  app.use("/api/user/", User);
  app.use("/api/comment/", Comment);
};
