import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import type { 
  User, 
  UpsertUser, 
  Post, 
  InsertPost, 
  Comment, 
  InsertComment, 
  PostWithUser, 
  CommentWithUser 
} from '@shared/schema';

export interface IStorage {
  // User operations
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

export class MongoStorage implements IStorage {
  private async getCollection(name: string) {
    const db = await getDatabase();
    return db.collection(name);
  }

  // User operations
async getUser(id: string): Promise<User | undefined> {
    const users = await this.getCollection('users');
    const user = await users.findOne({ _id: new ObjectId(id) });
    return user ? this.mapUserFromMongo(user) : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const users = await this.getCollection('users');
    
    const userDoc = {
      _id: new ObjectId(userData.id),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      bio: userData.bio,
      title: userData.title,
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
    };

    await users.replaceOne(
      { _id: new ObjectId(userData.id) },
      userDoc,
      { upsert: true }
    );

    return this.mapUserFromMongo(userDoc);
  }

  // Post operations
  async getPosts(userId?: string): Promise<PostWithUser[]> {
    const posts = await this.getCollection('posts');
    const users = await this.getCollection('users');
    
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $addFields: {
          isLiked: userId ? {
            $in: [userId, '$likedBy']
          } : false
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];

    const postsData = await posts.aggregate(pipeline).toArray();
    
    return postsData.map(post => ({
      id: post._id,
      userId: post.userId,
      content: post.content,
      imageUrl: post.imageUrl,
      likesCount: post.likedBy?.length || 0,
      commentsCount: post.commentsCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: this.mapUserFromMongo(post.user),
      isLiked: post.isLiked || false,
    }));
  }

  async getPost(id: string, userId?: string): Promise<PostWithUser | undefined> {
    const posts = await this.getCollection('posts');
    const users = await this.getCollection('users');
    
    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $addFields: {
          isLiked: userId ? {
            $in: [userId, '$likedBy']
          } : false
        }
      }
    ];

    const [post] = await posts.aggregate(pipeline).toArray();
    
    if (!post) return undefined;

    return {
      id: post._id,
      userId: post.userId,
      content: post.content,
      imageUrl: post.imageUrl,
      likesCount: post.likedBy?.length || 0,
      commentsCount: post.commentsCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: this.mapUserFromMongo(post.user),
      isLiked: post.isLiked || false,
    };
  }

async createPost(post: InsertPost): Promise {
    // Validate that post has required fields
    if (!post.userId || !post.content) {
        throw new Error("Post must have userId and content");
    }
    const posts = await this.getCollection('posts');
    
    const postDoc = {
      _id: new ObjectId(),
      userId: post.userId,
      content: post.content,
      imageUrl: post.imageUrl,
      likedBy: [],
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await posts.insertOne(postDoc);
    
   {
      id: postDoc._id.toString(),
      userId: postDoc.userId,
      content: postDoc.content,
      
      likesCount: 0,
      commentsCount: 0,
      createdAt: postDoc.createdAt,
      updatedAt: postDoc.updatedAt,
    };
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    const posts = await this.getCollection('posts');
    const result = await posts.deleteOne({ _id: new ObjectId(id), userId });
    
    // Also delete related likes and comments
    const likes = await this.getCollection('likes');
    const comments = await this.getCollection('comments');
    
    await likes.deleteMany({ postId: new ObjectId(id) });
    await comments.deleteMany({ postId: new ObjectId(id) });
    
    return result.deletedCount > 0;
  }

  // Comment operations
  async getPostComments(postId: string): Promise<CommentWithUser[]> {
    const comments = await this.getCollection('comments');
    const users = await this.getCollection('users');
    
    const pipeline = [
      { $match: { postId } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $sort: { createdAt: -1 }
      }
    ];

    const commentsData = await comments.aggregate(pipeline).toArray();
    
    return commentsData.map(comment => ({
      id: comment._id,
      postId: comment.postId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      user: this.mapUserFromMongo(comment.user),
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const comments = await this.getCollection('comments');
    const posts = await this.getCollection('posts');
    
    const commentDoc = {
      _id: new ObjectId().toString(),
      postId: comment.postId,
      userId: comment.userId,
      content: comment.content,
      createdAt: new Date(),
    };

    await comments.insertOne(commentDoc);
    
    // Increment comments count
    await posts.updateOne(
      { _id: comment.postId },
      { $inc: { commentsCount: 1 } }
    );

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
    
    const comment = await comments.findOne({ _id: id, userId });
    if (!comment) return false;

    const result = await comments.deleteOne({ _id: id, userId });
    
    if (result.deletedCount > 0) {
      // Decrement comments count
      await posts.updateOne(
        { _id: comment.postId },
        { $inc: { commentsCount: -1 } }
      );
    }

    return result.deletedCount > 0;
  }

  // Like operations
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const posts = await this.getCollection('posts');
    const post = await posts.findOne({ _id: postId });
    
    if (!post) {
      throw new Error('Post not found');
    }

    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      // Unlike
      await posts.updateOne(
        { _id: postId },
        { 
          $pull: { likedBy: userId },
          $inc: { likesCount: -1 }
        }
      );
      return { liked: false, likesCount: (post.likesCount || 1) - 1 };
    } else {
      // Like
      await posts.updateOne(
        { _id: postId },
        { 
          $addToSet: { likedBy: userId },
          $inc: { likesCount: 1 }
        }
      );
      return { liked: true, likesCount: (post.likesCount || 0) + 1 };
    }
  }

  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    const posts = await this.getCollection('posts');
    const post = await posts.findOne({ _id: postId });
    
    return post?.likedBy?.includes(userId) || false;
  }

  // Follow operations
  async toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean }> {
    const follows = await this.getCollection('follows');
    
    const existingFollow = await follows.findOne({
      followerId,
      followingId
    });

    if (existingFollow) {
      // Unfollow
      await follows.deleteOne({ _id: existingFollow._id });
      return { following: false };
    } else {
      // Follow
      await follows.insertOne({
        _id: new ObjectId().toString(),
        followerId,
        followingId,
        createdAt: new Date(),
      });
      return { following: true };
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follows = await this.getCollection('follows');
    const follow = await follows.findOne({
      followerId,
      followingId
    });
    
    return !!follow;
  }

  async getUserFollowersCount(userId: string): Promise<number> {
    const follows = await this.getCollection('follows');
    return await follows.countDocuments({ followingId: userId });
  }

  async getUserFollowingCount(userId: string): Promise<number> {
    const follows = await this.getCollection('follows');
    return await follows.countDocuments({ followerId: userId });
  }

  private mapUserFromMongo(mongoUser: any): User {
    return {
      id: mongoUser._id,
      email: mongoUser.email,
      firstName: mongoUser.firstName,
      lastName: mongoUser.lastName,
      profileImageUrl: mongoUser.profileImageUrl,
      bio: mongoUser.bio,
      title: mongoUser.title,
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt,
    };
  }
}

export const storage = new MongoStorage();
