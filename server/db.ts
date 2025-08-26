import { connectToDatabase } from './mongodb';

// Initialize MongoDB connection
connectToDatabase().catch(console.error);

export { getDatabase } from './mongodb';