import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';

// ====================
// MongoDB Document Interfaces
// ====================
interface MongoUser {
  _id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  title?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  otherLinks?: any[];
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

interface MongoPost {
  _id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likedBy: string[];
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MongoComment {
  _id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

interface MongoFollow {
  _id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

// ====================
// App Interfaces
// ====================
export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  title?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  otherLinks?: any[];
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  title?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  otherLinks?: any[];
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended' | 'banned';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertPost = import('@shared/schema').InsertPost & { userId: string };
export type InsertComment = import('@shared/schema').InsertComment & { postId: string; userId: string; };

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface PostWithUser extends Post {
  user: User;
  isLiked?: boolean;
}

export interface CommentWithUser extends Comment {
  user: User;
}

// ====================
// Storage Interface
// ====================
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getPosts(userId?: string): Promise<PostWithUser[]>;
  getPost(id: string, userId?: string): Promise<PostWithUser | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  deletePost(id: string, userId: string): Promise<boolean>;

  getPostComments(postId: string): Promise<CommentWithUser[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string, userId: string): Promise<boolean>;

  toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
  isPostLiked(postId: string, userId: string): Promise<boolean>;

  toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean }>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowersCount(userId: string): Promise<number>;
  getUserFollowingCount(userId: string): Promise<number>;

  getStories(userId?: string): Promise<any[]>;
  createStory(story: any): Promise<any>;
  deleteStory(id: string, userId: string): Promise<boolean>;
}

// ====================
// MongoDB Implementation
// ====================
export class MongoStorage implements IStorage {
  private async getCollection(name: string) {
    const db = await getDatabase();
    return db.collection(name);
  }

  // ----- User -----
  async getUser(id: string): Promise<User | undefined> {
    const users = await this.getCollection('users');
    const user = await users.findOne({ _id: id } as any);
    return user ? this.mapUserFromMongo(user as MongoUser) : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const users = await this.getCollection('users');

    const userDoc: MongoUser = {
      _id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      bio: userData.bio,
      title: userData.title,
      address: userData.address,
      gender: userData.gender,
      dateOfBirth: userData.dateOfBirth,
      phoneNumber: userData.phoneNumber,
      otherLinks: userData.otherLinks,
      role: userData.role ?? 'user',
      status: userData.status ?? 'active',
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
    };

    await users.replaceOne({ _id: userData.id } as any, userDoc as any, { upsert: true });

    return this.mapUserFromMongo(userDoc);
  }

  // ----- Posts -----
  async getPosts(userId?: string): Promise<PostWithUser[]> {
    const posts = await this.getCollection('posts');

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $addFields: {
          isLiked: userId ? { $in: [userId, '$likedBy'] } : false
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    const postsData = await posts.aggregate(pipeline).toArray();

    return postsData.map(post => ({
      id: (post as any)._id,
      userId: (post as any).userId,
      content: (post as any).content,
      imageUrl: (post as any).imageUrl || null,
      videoUrl: (post as any).videoUrl || null,
      likesCount: (post as any).likedBy?.length || 0,
      commentsCount: (post as any).commentsCount || 0,
      createdAt: (post as any).createdAt,
      updatedAt: (post as any).updatedAt,
      user: this.mapUserFromMongo((post as any).user),
      isLiked: (post as any).isLiked || false,
    }));
  }

  async getPost(id: string, userId?: string): Promise<PostWithUser | undefined> {
    const posts = await this.getCollection('posts');

    const pipeline = [
      { $match: { _id: id } as any },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $addFields: {
          isLiked: userId ? { $in: [userId, '$likedBy'] } : false
        }
      }
    ];

    const postsData = await posts.aggregate(pipeline).toArray();
    const post = postsData[0];
    if (!post) return undefined;

    return {
      id: (post as any)._id,
      userId: (post as any).userId,
      content: (post as any).content,
      imageUrl: (post as any).imageUrl || null,
      videoUrl: (post as any).videoUrl || null,
      likesCount: (post as any).likedBy?.length || 0,
      commentsCount: (post as any).commentsCount || 0,
      createdAt: (post as any).createdAt,
      updatedAt: (post as any).updatedAt,
      user: this.mapUserFromMongo((post as any).user),
      isLiked: (post as any).isLiked || false,
    };
  }

  async createPost(post: InsertPost): Promise<Post> {
    const posts = await this.getCollection('posts');

    const postDoc: MongoPost = {
      _id: new ObjectId().toString(),
      userId: post.userId,
      content: post.content,
      imageUrl: post.imageUrl,
      videoUrl: (post as any).videoUrl,
      likedBy: [],
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await posts.insertOne(postDoc as any);

    return {
      id: postDoc._id,
      userId: postDoc.userId,
      content: postDoc.content,
      imageUrl: postDoc.imageUrl,
      videoUrl: postDoc.videoUrl,
      likesCount: 0,
      commentsCount: 0,
      createdAt: postDoc.createdAt,
      updatedAt: postDoc.updatedAt,
    };
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    const posts = await this.getCollection('posts');
    const result = await posts.deleteOne({ _id: id, userId } as any);

    const comments = await this.getCollection('comments');
    await comments.deleteMany({ postId: id } as any);

    return result.deletedCount > 0;
  }

  // ----- Comments -----
  async getPostComments(postId: string): Promise<CommentWithUser[]> {
    const comments = await this.getCollection('comments');

    const pipeline = [
      { $match: { postId } as any },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $sort: { createdAt: -1 } }
    ];

    const commentsData = await comments.aggregate(pipeline).toArray();

    return commentsData.map(comment => ({
      id: (comment as any)._id,
      postId: (comment as any).postId,
      userId: (comment as any).userId,
      content: (comment as any).content,
      createdAt: (comment as any).createdAt,
      user: this.mapUserFromMongo((comment as any).user),
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const comments = await this.getCollection('comments');
    const posts = await this.getCollection('posts');

    const commentDoc: MongoComment = {
      _id: new ObjectId().toString(),
      postId: comment.postId,
      userId: comment.userId,
      content: comment.content,
      createdAt: new Date(),
    };

    await comments.insertOne(commentDoc as any);
    await posts.updateOne({ _id: comment.postId } as any, { $inc: { commentsCount: 1 } });

    return {
      id: commentDoc._id,
      postId: commentDoc.postId,
      userId: commentDoc.userId,
      content: commentDoc.content,
      createdAt: commentDoc.createdAt,
    };
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    const comments = await this.getCollection('comments');
    const posts = await this.getCollection('posts');

    const comment = await comments.findOne({ _id: id, userId } as any);
    if (!comment) return false;

    const result = await comments.deleteOne({ _id: id, userId } as any);

    if (result.deletedCount && result.deletedCount > 0) {
      await posts.updateOne({ _id: (comment as any).postId } as any, { $inc: { commentsCount: -1 } });
    }

    return result.deletedCount > 0;
  }

  // ----- Likes -----
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const posts = await this.getCollection('posts');
    const post = await posts.findOne({ _id: postId } as any);
    if (!post) throw new Error('Post not found');

    const likedBy = (post as any).likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      await posts.updateOne({ _id: postId } as any, { $pull: { likedBy: userId } });
      return { liked: false, likesCount: Math.max(0, likedBy.length - 1) };
    } else {
      await posts.updateOne({ _id: postId } as any, { $addToSet: { likedBy: userId } });
      return { liked: true, likesCount: likedBy.length + 1 };
    }
  }

  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    const posts = await this.getCollection('posts');
    const post = await posts.findOne({ _id: postId } as any);
    return (post as any)?.likedBy?.includes(userId) || false;
  }

  // ----- Follows -----
  async toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean }> {
    const follows = await this.getCollection('follows');

    const existingFollow = await follows.findOne({ followerId, followingId } as any);
    if (existingFollow) {
      await follows.deleteOne({ _id: (existingFollow as any)._id } as any);
      return { following: false };
    } else {
      const followDoc: MongoFollow = {
        _id: new ObjectId().toString(),
        followerId,
        followingId,
        createdAt: new Date(),
      };
      await follows.insertOne(followDoc as any);
      return { following: true };
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follows = await this.getCollection('follows');
    const follow = await follows.findOne({ followerId, followingId } as any);
    return !!follow;
  }

  async getUserFollowersCount(userId: string): Promise<number> {
    const follows = await this.getCollection('follows');
    return await follows.countDocuments({ followingId: userId } as any);
  }

  async getUserFollowingCount(userId: string): Promise<number> {
    const follows = await this.getCollection('follows');
    return await follows.countDocuments({ followerId: userId } as any);
  }

  // ----- Stories -----
  async getStories(userId?: string): Promise<any[]> {
    const stories = await this.getCollection('stories');

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { expiresAt: { $gt: new Date() } } },
      { $sort: { createdAt: -1 } }
    ];

    const storiesData = await stories.aggregate(pipeline).toArray();

    return storiesData.map(story => ({
      id: (story as any)._id,
      userId: (story as any).userId,
      content: (story as any).content,
      imageUrl: (story as any).imageUrl,
      videoUrl: (story as any).videoUrl,
      expiresAt: (story as any).expiresAt,
      createdAt: (story as any).createdAt,
      user: this.mapUserFromMongo((story as any).user),
    }));
  }

  async createStory(story: any): Promise<any> {
    const stories = await this.getCollection('stories');

    const storyDoc = {
      _id: new ObjectId().toString(),
      userId: story.userId,
      content: story.content,
      imageUrl: story.imageUrl,
      videoUrl: story.videoUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    await stories.insertOne(storyDoc as any);

    return {
      id: storyDoc._id,
      userId: storyDoc.userId,
      content: storyDoc.content,
      imageUrl: storyDoc.imageUrl,
      videoUrl: storyDoc.videoUrl,
      expiresAt: storyDoc.expiresAt,
      createdAt: storyDoc.createdAt,
    };
  }

  async deleteStory(id: string, userId: string): Promise<boolean> {
    const stories = await this.getCollection('stories');
    const result = await stories.deleteOne({ _id: id, userId } as any);
    return result.deletedCount > 0;
  }

  // ----- Utils -----
  private mapUserFromMongo(mongoUser: MongoUser): User {
    return {
      id: mongoUser._id,
      email: mongoUser.email,
      firstName: mongoUser.firstName,
      lastName: mongoUser.lastName,
      profileImageUrl: mongoUser.profileImageUrl,
      bio: mongoUser.bio,
      title: mongoUser.title,
      address: mongoUser.address,
      gender: mongoUser.gender,
      dateOfBirth: mongoUser.dateOfBirth,
      phoneNumber: mongoUser.phoneNumber,
      otherLinks: mongoUser.otherLinks,
      role: mongoUser.role ?? 'user',
      status: mongoUser.status ?? 'active',
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt,
    };
  }
}

export const storage = new MongoStorage();
