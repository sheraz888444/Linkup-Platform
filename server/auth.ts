import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from './mongoStorageWorking';
import { User } from './mongoStorageWorking';
import { getDatabase } from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

// Extended user interface for authentication
export interface AuthUser extends User {
  password: string;
}

// Initialize auth collection
async function getAuthCollection() {
  const db = await getDatabase();
  return db.collection('auth');
}

// Signup function
export async function signup(email: string, password: string, firstName?: string, lastName?: string): Promise<{ user: User; token: string }> {
  const authCollection = await getAuthCollection();
  
  // Check if user already exists
  const existingUser = await authCollection.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  
  // Create user in the existing storage system
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const user = await storage.upsertUser({
    id: userId,
    email,
    firstName,
    lastName,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Store the hashed password in the auth collection
  await authCollection.insertOne({
    userId: user.id,
    email,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Generate JWT token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  
  return { user, token };
}

// Login function
export async function login(email: string, password: string): Promise<{ user: User; token: string } | null> {
  const authCollection = await getAuthCollection();
  
  // Find the user by email in the auth collection
  const authUser = await authCollection.findOne({ email });
  if (!authUser) {
    return null;
  }
  
  // Compare the provided password with the stored hashed password
  const isPasswordValid = await bcrypt.compare(password, authUser.password);
  if (!isPasswordValid) {
    return null;
  }
  
  // Get the user details from the main users collection
  const user = await storage.getUser(authUser.userId);
  if (!user) {
    // Create the user if it doesn't exist in the main collection
    const newUser = await storage.upsertUser({
      id: authUser.userId,
      email,
      createdAt: authUser.createdAt,
      updatedAt: new Date()
    });
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    return { user: newUser, token };
  }
  
  // Generate and return a JWT token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { user, token };
}

// Authentication middleware
export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}