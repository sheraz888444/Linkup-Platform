import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./mongoStorageWorking";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";
import { signupController, loginController, getAuthUserController } from "./controllers/authController";
import { authenticateToken } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/signup', signupController);
  app.post('/api/auth/login', loginController);
  app.get('/api/auth/user', authenticateToken, getAuthUserController);

  // Update user profile
  app.put('/api/auth/user', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { bio, title } = req.body;
      
      const updatedUser = await storage.upsertUser({
        id: userId,
        bio,
        title,
        updatedAt: new Date(),
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Posts routes
  app.get('/api/posts', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.userId;
      const posts = await storage.getPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/:id', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.userId;
      const postId = req.params.id;
      const post = await storage.getPost(postId, userId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/posts', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const postData = insertPostSchema.parse({
        ...req.body,
        userId,
      });
      
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid post data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create post" });
      }
    }
  });

  app.delete('/api/posts/:id', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const postId = req.params.id;
      
      const deleted = await storage.deletePost(postId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Post not found or unauthorized" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Comments routes
  app.get('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
    try {
      const postId = req.params.postId;
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/posts/:postId/comments', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const postId = req.params.postId;
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        postId,
        userId,
      });
      
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create comment" });
      }
    }
  });

  app.delete('/api/comments/:id', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const commentId = req.params.id;
      
      const deleted = await storage.deleteComment(commentId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found or unauthorized" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Like routes
  app.post('/api/posts/:postId/like', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const postId = req.params.postId;
      
      const result = await storage.toggleLike(postId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Follow routes
  app.post('/api/users/:userId/follow', authenticateToken, async (req: any, res) => {
    try {
      const followerId = req.user.userId;
      const followingId = req.params.userId;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const result = await storage.toggleFollow(followerId, followingId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  app.get('/api/users/:userId/follow-status', authenticateToken, async (req: any, res) => {
    try {
      const followerId = req.user.userId;
      const followingId = req.params.userId;
      
      const isFollowing = await storage.isFollowing(followerId, followingId);
      res.json({ following: isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
