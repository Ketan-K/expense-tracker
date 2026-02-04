import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 10000, // Increased for production
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  retryReads: true,
};

// Retry connection with exponential backoff
async function connectWithRetry(
  client: MongoClient,
  maxRetries = 3,
  baseDelay = 1000
): Promise<MongoClient> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`MongoDB connection attempt ${attempt}/${maxRetries}...`);
      const connectedClient = await client.connect();
      console.log("✅ MongoDB connected successfully");
      return connectedClient;
    } catch (error) {
      lastError = error as Error;
      const errorCode = (error as any)?.code;
      console.warn(`MongoDB connection attempt ${attempt} failed:`, errorCode || error);

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error("❌ MongoDB connection failed after all retries (offline mode)");
  throw lastError || new Error("MongoDB connection failed");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let isConnecting = false;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the value across module reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoClient?: MongoClient;
    _isConnecting?: boolean;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClient = client;
    globalWithMongo._isConnecting = true;
    globalWithMongo._mongoClientPromise = connectWithRetry(client).finally(() => {
      globalWithMongo._isConnecting = false;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
  client = globalWithMongo._mongoClient!;
  isConnecting = globalWithMongo._isConnecting || false;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  isConnecting = true;
  clientPromise = connectWithRetry(client).finally(() => {
    isConnecting = false;
  });
}

// Helper function to get a connected client with retry on failure
export async function getConnectedClient(): Promise<MongoClient> {
  try {
    return await clientPromise;
  } catch (error) {
    // Check if a connection attempt is already in progress
    if (process.env.NODE_ENV === "development") {
      const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
        _mongoClient?: MongoClient;
        _isConnecting?: boolean;
      };

      // If already connecting, wait for that attempt to finish
      if (globalWithMongo._isConnecting) {
        console.log("Connection attempt already in progress, waiting...");
        return await globalWithMongo._mongoClientPromise!;
      }

      // Otherwise, start a new connection attempt
      console.log("Retrying MongoDB connection...");
      const newClient = new MongoClient(uri, options);
      globalWithMongo._isConnecting = true;
      const newPromise = connectWithRetry(newClient, 2, 500).finally(() => {
        globalWithMongo._isConnecting = false;
      });

      globalWithMongo._mongoClientPromise = newPromise;
      globalWithMongo._mongoClient = newClient;

      return await newPromise;
    } else {
      // Production mode - if already connecting, wait for it
      if (isConnecting) {
        console.log("Connection attempt already in progress, waiting...");
        return await clientPromise;
      }

      // Otherwise, retry
      console.log("Retrying MongoDB connection...");
      const newClient = new MongoClient(uri, options);
      isConnecting = true;
      clientPromise = connectWithRetry(newClient, 2, 500).finally(() => {
        isConnecting = false;
      });

      return await clientPromise;
    }
  }
}

export default clientPromise;
