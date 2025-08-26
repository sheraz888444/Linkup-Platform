import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || `mongodb+srv://sheraz:10051100$@cluster0.tgz201i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongoConnection {
  client: MongoClient;
  db: Db;
}

let cached: MongoConnection | null = null;

export async function connectToDatabase(): Promise<MongoConnection> {
  if (cached) {
    return cached;
  }

  const client = new MongoClient(MONGODB_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('linkedin-lead');
    
    cached = {
      client,
      db,
    };
    
    return cached;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function getDatabase(): Promise<Db> {
  const connection = await connectToDatabase();
  return connection.db;
}
