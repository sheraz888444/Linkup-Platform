import { Request, Response } from 'express';
import { signup, login } from '../auth';

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
        lastName: user.lastName
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
        lastName: user.lastName
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
    // Return the authenticated user's data
    res.json(req.user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}