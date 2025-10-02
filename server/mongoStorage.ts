import { ObjectId } from 'mongodb';
import { connectToDatabase, getDatabase } from './mongodb';
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

  // Friend operations
  sendFriendRequest(fromUserId: string, toUserId: string): Promise<boolean>;
  acceptFriendRequest(userId: string, requestingUserId: string): Promise<boolean>;
  rejectFriendRequest(userId: string, requestingUserId: string): Promise<boolean>;
  removeFriend(userId: string, friendId: string): Promise<boolean>;
  getFriends(userId: string): Promise<User[]>;
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
      videoUrl: post.videoUrl,
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
      videoUrl: post.videoUrl,
      likesCount: post.likedBy?.length || 0,
      commentsCount: post.commentsCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: this.mapUserFromMongo(post.user),
      isLiked: post.isLiked || false,
    };
  }

async createPost(post: InsertPost): Promise<Post> {
    // Validate that post has required fields
    if (!post.userId || !post.content) {
        throw new Error("Post must have userId and content");
    }
    const posts = await this.getCollection('posts');

    const postDoc = {
      _id: new ObjectId(),
      userId: post.userId,
      content: post.content,
      imageUrl: post.imageUrl ?? null,
      videoUrl: post.videoUrl ?? null,
      likedBy: [],
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await posts.insertOne(postDoc);

    return {
      id: postDoc._id.toString(),
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
    const postId = new ObjectId(id);
    const result = await posts.deleteOne({ _id: postId, userId });

    if (result.deletedCount === 0) {
      return false;
    }
    // Also delete related comments
    const comments = await this.getCollection('comments');
    await comments.deleteMany({ postId: postId });
    
    return result.deletedCount > 0;
  }

  // Comment operations
  async getPostComments(postId: string): Promise<CommentWithUser[]> {
    const comments = await this.getCollection('comments');
    const users = await this.getCollection('users');
    
    const pipeline = [
      { $match: { postId: new ObjectId(postId) } },
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
      _id: new ObjectId(),
      postId: comment.postId,
      userId: comment.userId,
      content: comment.content,
      createdAt: new Date(),
    };

    await comments.insertOne(commentDoc);
    
    // Increment comments count
    await posts.updateOne(
      { _id: new ObjectId(comment.postId) },
      { $inc: { commentsCount: 1 } }
    );

    return {
      id: commentDoc._id.toString(),
      postId: commentDoc.postId,
      userId: commentDoc.userId,
      content: commentDoc.content,
      createdAt: commentDoc.createdAt,
    };
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    const comments = await this.getCollection('comments');
    const posts = await this.getCollection('posts');
    
    const commentId = new ObjectId(id);
    const comment = await comments.findOne({ _id: commentId, userId });
    if (!comment) return false;

    const result = await comments.deleteOne({ _id: commentId, userId });
    
    if (result.deletedCount > 0) {
      // Decrement comments count
      await posts.updateOne(
        { _id: new ObjectId(comment.postId) },
        { $inc: { commentsCount: -1 } }
      );
    }

    return result.deletedCount > 0;
  }

  // Like operations
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const posts = await this.getCollection('posts');
    const postObjectId = new ObjectId(postId);
    const post = await posts.findOne({ _id: postObjectId });
    
    if (!post) {
      throw new Error('Post not found');
    }

    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      // Unlike
      await posts.updateOne(
        { _id: postObjectId },
        { 
          $pull: { likedBy: userId } as any, // Use `as any` to bypass strict BSON type checking for $pull
          $inc: { likesCount: -1 }
        }
      );
      return { liked: false, likesCount: (post.likesCount || 1) - 1 };
    } else {
      // Like
      await posts.updateOne(
        { _id: postObjectId },
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
    const post = await posts.findOne({ _id: new ObjectId(postId) });
    
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
      await follows.insertOne({ // This could be a separate collection
        _id: new ObjectId(),
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

  // Friend operations
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
    const users = await this.getCollection('users');
    // Add to the recipient's friendRequests array
    const result = await users.updateOne(
      { _id: new ObjectId(toUserId), friendRequests: { $ne: fromUserId }, friends: { $ne: fromUserId } },
      { $addToSet: { friendRequests: fromUserId } }
    );
    return result.modifiedCount > 0;
  }

  async acceptFriendRequest(userId: string, requestingUserId: string): Promise<boolean> {
    const users = await this.getCollection('users');
    const { client } = await connectToDatabase();
    const session = client.startSession();
    let success = false;
    try {
      await session.withTransaction(async () => {
        // 1. Remove from my friendRequests
        const res1 = await users.updateOne(
          { _id: new ObjectId(userId) },
          { $pull: { friendRequests: requestingUserId } as any},
          { session }
        );

        // 2. Add to my friends list
        const res2 = await users.updateOne(
          { _id: new ObjectId(userId) },
          { $addToSet: { friends: requestingUserId } },
          { session }
        );

        // 3. Add me to their friends list
        const res3 = await users.updateOne(
          { _id: new ObjectId(requestingUserId) },
          { $addToSet: { friends: userId } },
          { session }
        );

        if (res1.modifiedCount > 0 && res2.modifiedCount > 0 && res3.modifiedCount > 0) {
          success = true;
        } else {
          // If something failed, abort the transaction
          await session.abortTransaction();
        }
      });
    } finally {
      await session.endSession();
    }
    return success;
  }

  async rejectFriendRequest(userId: string, requestingUserId:string): Promise<boolean> {
    const users = await this.getCollection('users');
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { friendRequests: requestingUserId } as any}
    );
    return result.modifiedCount > 0;
  }

  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    const users = await this.getCollection('users');
    // Remove from both users' friends lists
    const res1 = await users.updateOne({ _id: new ObjectId(userId) }, { $pull: { friends: friendId } as any });
    const res2 = await users.updateOne({ _id: new ObjectId(friendId) }, { $pull: { friends: userId } as any });
    return res1.modifiedCount > 0 && res2.modifiedCount > 0;
  }

  async getFriends(userId: string): Promise<User[]> {
    const users = await this.getCollection('users');
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user || !user.friends) return [];
    const friendIds = user.friends.map((id: string) => new ObjectId(id));
    const friends = await users.find({ _id: { $in: friendIds } }).toArray();
    return friends.map(this.mapUserFromMongo);
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
      address: mongoUser.address,
      gender: mongoUser.gender,
      dateOfBirth: mongoUser.dateOfBirth,
      phoneNumber: mongoUser.phoneNumber,
      otherLinks: mongoUser.otherLinks,
      role: mongoUser.role,
      status: mongoUser.status,
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt,
    };
  }
}

export const storage = new MongoStorage();
