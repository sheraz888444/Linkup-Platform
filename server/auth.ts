import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from './mongoStorageWorking';
import { User } from './mongoStorageWorking';
import { getDatabase } from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
  
  // Ensure admin role from env if configured
  const emailLower = (user.email || '').toLowerCase();
  const isAdminEnv = ADMIN_EMAILS.includes(emailLower);
  let ensuredUser = user;
  if (isAdminEnv && (user as any).role !== 'admin') {
    ensuredUser = await storage.upsertUser({ id: user.id, role: 'admin', updatedAt: new Date() } as any);
  }
  // Generate JWT token with role and status
  const token = jwt.sign(
    { userId: ensuredUser.id, email: ensuredUser.email, role: (ensuredUser as any).role ?? 'user', status: (ensuredUser as any).status ?? 'active' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return { user: ensuredUser, token };
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
    // Ensure admin role from env if configured for newly created user
    {
      const emailLower = (email || '').toLowerCase();
      const isAdminEnv = ADMIN_EMAILS.includes(emailLower);
      let ensuredNewUser = newUser;
      if (isAdminEnv && (newUser as any).role !== 'admin') {
        ensuredNewUser = await storage.upsertUser({ id: newUser.id, role: 'admin', updatedAt: new Date() } as any);
      }
      const token = jwt.sign(
        { userId: ensuredNewUser.id, email: ensuredNewUser.email, role: (ensuredNewUser as any).role ?? 'user', status: (ensuredNewUser as any).status ?? 'active' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return { user: ensuredNewUser, token };
    }
  }
  
  // Ensure admin role from env if configured for existing user
  {
    const emailLower = (email || '').toLowerCase();
    const isAdminEnv = ADMIN_EMAILS.includes(emailLower);
    let ensuredUser = user!;
    if (isAdminEnv && (user as any).role !== 'admin') {
      ensuredUser = await storage.upsertUser({ id: user.id, role: 'admin', updatedAt: new Date() } as any);
    }
    // Generate and return a JWT token (include role and status)
    const token = jwt.sign(
      { userId: ensuredUser.id, email: ensuredUser.email, role: (ensuredUser as any).role ?? 'user', status: (ensuredUser as any).status ?? 'active' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return { user: ensuredUser, token };
  }
}

// Authentication middleware
export async function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    // Fetch live user to ensure status/role are up-to-date
    const dbUser = await storage.getUser(decoded.userId);
    if (!dbUser) {
      return res.status(401).json({ message: 'User not found' });
    }
    if ((dbUser as any).status && (dbUser as any).status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: (dbUser as any).role ?? decoded.role ?? 'user',
      status: (dbUser as any).status ?? decoded.status ?? 'active',
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// Role-based authorization middleware
export function authorizeRoles(...allowed: Array<'admin' | 'user'>) {
  return (req: any, res: any, next: any) => {
    const role = req.user?.role as 'admin' | 'user' | undefined;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}