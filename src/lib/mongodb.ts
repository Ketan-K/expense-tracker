import { MongoClient, ServerApiVersion } from "mongodb";

console.log("[MongoDB] Initializing connection...");
console.log("[MongoDB] Environment check:", {
  hasMongoUri: !!process.env.MONGODB_URI,
  uriPrefix: process.env.MONGODB_URI?.substring(0, 20) + "...",
  nodeEnv: process.env.NODE_ENV,
});

if (!process.env.MONGODB_URI) {
  console.error("[MongoDB] MONGODB_URI is not defined!");
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the value across module reloads
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
