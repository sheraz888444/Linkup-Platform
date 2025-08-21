import {
  users,
  posts,
  comments,
  likes,
  follows,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type PostWithUser,
  type CommentWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Post operations
  getPosts(userId?: string): Promise<PostWithUser[]>;
  getPost(id: string, userId?: string): Promise<PostWithUser | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  deletePost(id: string, userId: string): Promise<boolean>;
  
  // Comment operations
  getPostComments(postId: string): Promise<CommentWithUser[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string, userId: string): Promise<boolean>;
  
  // Like operations
  toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
  isPostLiked(postId: string, userId: string): Promise<boolean>;
  
  // Follow operations
  toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean }>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowersCount(userId: string): Promise<number>;
  getUserFollowingCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Post operations
  async getPosts(userId?: string): Promise<PostWithUser[]> {
    const postsData = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageUrl: posts.imageUrl,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          title: users.title,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        isLiked: userId ? sql<boolean>`EXISTS(
          SELECT 1 FROM ${likes} 
          WHERE ${likes.postId} = ${posts.id} 
          AND ${likes.userId} = ${userId}
        )` : sql<boolean>`false`,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));

    return postsData as PostWithUser[];
  }

  async getPost(id: string, userId?: string): Promise<PostWithUser | undefined> {
    const [postData] = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageUrl: posts.imageUrl,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          title: users.title,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        isLiked: userId ? sql<boolean>`EXISTS(
          SELECT 1 FROM ${likes} 
          WHERE ${likes.postId} = ${posts.id} 
          AND ${likes.userId} = ${userId}
        )` : sql<boolean>`false`,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id));

    return postData as PostWithUser;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Comment operations
  async getPostComments(postId: string): Promise<CommentWithUser[]> {
    const commentsData = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          title: users.title,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    return commentsData as CommentWithUser[];
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    
    // Increment comments count
    await db
      .update(posts)
      .set({
        commentsCount: sql`${posts.commentsCount} + 1`,
      })
      .where(eq(posts.id, comment.postId));

    return newComment;
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    // Get the comment first to get the postId
    const [comment] = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, id), eq(comments.userId, userId)));

    if (!comment) return false;

    const result = await db
      .delete(comments)
      .where(and(eq(comments.id, id), eq(comments.userId, userId)))
      .returning();

    if (result.length > 0) {
      // Decrement comments count
      await db
        .update(posts)
        .set({
          commentsCount: sql`${posts.commentsCount} - 1`,
        })
        .where(eq(posts.id, comment.postId));
      return true;
    }

    return false;
  }

  // Like operations
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

    if (existingLike.length > 0) {
      // Unlike
      await db
        .delete(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
      
      await db
        .update(posts)
        .set({
          likesCount: sql`${posts.likesCount} - 1`,
        })
        .where(eq(posts.id, postId));

      const [updatedPost] = await db
        .select({ likesCount: posts.likesCount })
        .from(posts)
        .where(eq(posts.id, postId));

      return { liked: false, likesCount: updatedPost.likesCount || 0 };
    } else {
      // Like
      await db.insert(likes).values({ postId, userId });
      
      await db
        .update(posts)
        .set({
          likesCount: sql`${posts.likesCount} + 1`,
        })
        .where(eq(posts.id, postId));

      const [updatedPost] = await db
        .select({ likesCount: posts.likesCount })
        .from(posts)
        .where(eq(posts.id, postId));

      return { liked: true, likesCount: updatedPost.likesCount || 0 };
    }
  }

  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    return result.length > 0;
  }

  // Follow operations
  async toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean }> {
    const existingFollow = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));

    if (existingFollow.length > 0) {
      // Unfollow
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
      return { following: false };
    } else {
      // Follow
      await db.insert(follows).values({ followerId, followingId });
      return { following: true };
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return result.length > 0;
  }

  async getUserFollowersCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, userId));
    return result[0]?.count || 0;
  }

  async getUserFollowingCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, userId));
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
