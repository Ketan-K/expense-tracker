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

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the value across module reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoClient?: MongoClient;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClient = client;
    globalWithMongo._mongoClientPromise = connectWithRetry(client);
  }
  clientPromise = globalWithMongo._mongoClientPromise;
  client = globalWithMongo._mongoClient!;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = connectWithRetry(client);
}

// Helper function to get a connected client with retry on failure
export async function getConnectedClient(): Promise<MongoClient> {
  try {
    return await clientPromise;
  } catch (error) {
    console.log("Retrying MongoDB connection...");
    // Reset the promise and try again
    const newClient = new MongoClient(uri, options);
    const newPromise = connectWithRetry(newClient, 2, 500); // Fewer retries on re-attempt

    if (process.env.NODE_ENV === "development") {
      const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
        _mongoClient?: MongoClient;
      };
      globalWithMongo._mongoClientPromise = newPromise;
      globalWithMongo._mongoClient = newClient;
    }

    return await newPromise;
  }
}

export default clientPromise;
