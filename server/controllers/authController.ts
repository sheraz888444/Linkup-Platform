import { Request, Response } from 'express';
import { signup, login } from '../auth';
import { storage } from '../mongoStorageWorking';

export async function signupController(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Create user
    const { user, token } = await signup(email, password, firstName, lastName);
    
    // Return user data and token
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: (user as any).role ?? 'user',
        status: (user as any).status ?? 'active',
        profileImageUrl: (user as any).profileImageUrl,
        bio: (user as any).bio,
        title: (user as any).title,
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
      },
      token
    });
  } catch (error: any) {
    if (error.message === 'User already exists') {
      return res.status(409).json({ message: 'User already exists' });
    }
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Authenticate user
    const result = await login(email, password);
    if (!result) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Return user data and token
    const { user, token } = result;
    res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: (user as any).role ?? 'user',
        status: (user as any).status ?? 'active',
        profileImageUrl: (user as any).profileImageUrl,
        bio: (user as any).bio,
        title: (user as any).title,
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getAuthUserController(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user.id,
      email: user.email,
      firstName: (user as any).firstName,
      lastName: (user as any).lastName,
      role: (user as any).role ?? 'user',
      status: (user as any).status ?? 'active',
      profileImageUrl: (user as any).profileImageUrl,
      bio: (user as any).bio,
      title: (user as any).title,
      address: (user as any).address,
      gender: (user as any).gender,
      dateOfBirth: (user as any).dateOfBirth,
      phoneNumber: (user as any).phoneNumber,
      otherLinks: (user as any).otherLinks,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateUserProfileController(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      firstName,
      lastName,
      profileImageUrl,
      bio,
      title,
      address,
      gender,
      dateOfBirth,
      phoneNumber,
      otherLinks
    } = req.body;

    // Get current user data
    const currentUser = await storage.getUser(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user profile
    const updatedUser = await storage.upsertUser({
      id: userId,
      email: currentUser.email,
      firstName: firstName ?? currentUser.firstName,
      lastName: lastName ?? currentUser.lastName,
      profileImageUrl: profileImageUrl ?? currentUser.profileImageUrl,
      bio: bio ?? currentUser.bio,
      title: title ?? currentUser.title,
      address: address ?? (currentUser as any).address,
      gender: gender ?? (currentUser as any).gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : (currentUser as any).dateOfBirth,
      phoneNumber: phoneNumber ?? (currentUser as any).phoneNumber,
      otherLinks: otherLinks ?? (currentUser as any).otherLinks,
      role: currentUser.role,
      status: currentUser.status,
      createdAt: currentUser.createdAt,
      updatedAt: new Date(),
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: (updatedUser as any).firstName,
        lastName: (updatedUser as any).lastName,
        role: (updatedUser as any).role ?? 'user',
        status: (updatedUser as any).status ?? 'active',
        profileImageUrl: (updatedUser as any).profileImageUrl,
        bio: (updatedUser as any).bio,
        title: (updatedUser as any).title,
        address: (updatedUser as any).address,
        gender: (updatedUser as any).gender,
        dateOfBirth: (updatedUser as any).dateOfBirth,
        phoneNumber: (updatedUser as any).phoneNumber,
        otherLinks: (updatedUser as any).otherLinks,
        createdAt: (updatedUser as any).createdAt,
        updatedAt: (updatedUser as any).updatedAt,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
