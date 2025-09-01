import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./mongoStorageWorking";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";
import { signupController, loginController, getAuthUserController } from "./controllers/authController";
import { authenticateToken, authorizeRoles } from "./auth";
import { getDatabase } from "./mongodb";
import multer from "multer";
import path from "path";
import { existsSync, mkdirSync } from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup uploads directory and multer storage
  const UPLOAD_DIR = path.resolve("uploads");
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const storageCfg = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, name);
    },
  });

  const upload = multer({
    storage: storageCfg,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (_req, file, cb) => {
      const allowed = new Set<string>([
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/jpg",
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ]);
      if (allowed.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Unsupported file type"));
      }
    },
  });
  // Auth routes
  app.post('/api/auth/signup', signupController);
  app.post('/api/auth/login', loginController);
  app.get('/api/auth/user', authenticateToken, getAuthUserController);

  // Media upload
  app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const url = `/uploads/${file.filename}`;
      const type = file.mimetype.startsWith("video/") ? "video" : "image";
      res.json({ url, type });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Update user profile
  app.put('/api/auth/user', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { bio, title, profileImageUrl } = req.body;

      const updatedUser = await storage.upsertUser({
        id: userId,
        bio,
        title,
        profileImageUrl,
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

  // Admin routes (protected by role)
  app.get('/api/admin/stats', authenticateToken, authorizeRoles('admin'), async (_req, res) => {
    try {
      const db = await getDatabase();
      const usersCol = db.collection('users');
      const postsCol = db.collection('posts');

      const [totalUsers, totalPosts, activeUsers, suspendedUsers] = await Promise.all([
        usersCol.countDocuments({} as any),
        postsCol.countDocuments({} as any),
        usersCol.countDocuments({ status: 'active' } as any),
        usersCol.countDocuments({ status: 'suspended' } as any),
      ]);

      const flaggedPosts = 0;
      const totalGroups = 0;
      const totalStories = 0;

      res.json({ totalUsers, totalPosts, activeUsers, suspendedUsers, flaggedPosts, totalGroups, totalStories });
    } catch (error) {
      console.error("Error admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/users', authenticateToken, authorizeRoles('admin'), async (_req, res) => {
    try {
      const db = await getDatabase();
      const usersCol = db.collection('users');
      const postsCol = db.collection('posts');
      const followsCol = db.collection('follows');

      const users = await usersCol.find({} as any).limit(50).toArray();

      const result = await Promise.all(
        users.map(async (u: any) => {
          const [postsCount, followersCount] = await Promise.all([
            postsCol.countDocuments({ userId: u._id } as any),
            followsCol.countDocuments({ followingId: u._id } as any),
          ]);
          return {
            id: u._id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            status: u.status ?? 'active',
            createdAt: (u.createdAt instanceof Date ? u.createdAt : new Date()).toISOString(),
            postsCount,
            followersCount,
          };
        })
      );

      res.json(result);
    } catch (error) {
      console.error("Error admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users/:userId/suspend', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
      const { userId } = req.params as any;
      const db = await getDatabase();
      const usersCol = db.collection('users');

      const user = await usersCol.findOne({ _id: userId } as any);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const nextStatus = (user as any).status === 'active' ? 'suspended' : 'active';
      await usersCol.updateOne({ _id: userId } as any, { $set: { status: nextStatus, updatedAt: new Date() } } as any);
      res.json({ id: userId, status: nextStatus });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.get('/api/admin/posts', authenticateToken, authorizeRoles('admin'), async (_req, res) => {
    try {
      const db = await getDatabase();
      const postsCol = db.collection('posts');

      const posts = await postsCol.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $sort: { createdAt: -1 } },
        { $limit: 50 }
      ]).toArray();

      const mapped = posts.map((p: any) => ({
        id: p._id,
        content: p.content,
        userId: p.userId,
        user: {
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          email: p.user.email,
        },
        status: 'active',
        createdAt: (p.createdAt instanceof Date ? p.createdAt : new Date()).toISOString(),
        likesCount: Array.isArray(p.likedBy) ? p.likedBy.length : 0,
        commentsCount: p.commentsCount || 0,
      }));

      res.json(mapped);
    } catch (error) {
      console.error("Error admin posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.delete('/api/admin/posts/:postId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
      const { postId } = req.params as any;
      const db = await getDatabase();
      const postsCol = db.collection('posts');
      const commentsCol = db.collection('comments');

      const result = await postsCol.deleteOne({ _id: postId } as any);
      await commentsCol.deleteMany({ postId } as any);

      if (!result.deletedCount) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Search endpoint
  app.get('/api/search', authenticateToken, async (req, res) => {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q) {
        return res.status(400).json({ message: 'Missing query' });
      }
      const db = await getDatabase();
      const usersCol = db.collection('users');
      const postsCol = db.collection('posts');
      const regex = new RegExp(q, 'i');

      const [users, posts] = await Promise.all([
        usersCol.find({
          $or: [
            { firstName: { $regex: regex } } as any,
            { lastName: { $regex: regex } } as any,
            { email: { $regex: regex } } as any,
          ]
        } as any).limit(10).toArray(),
        postsCol.aggregate([
          { $match: { content: { $regex: regex } } as any },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: '$user' },
          { $limit: 10 }
        ]).toArray()
      ]);

      const mappedUsers = users.map((u: any) => ({
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
      }));

      const mappedPosts = posts.map((p: any) => ({
        id: p._id,
        content: p.content,
        userId: p.userId,
        user: {
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          email: p.user.email,
        }
      }));

      res.json({ users: mappedUsers, posts: mappedPosts, query: q });
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ message: "Failed to search" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
