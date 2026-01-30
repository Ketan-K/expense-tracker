import { ObjectId } from "bson";

/**
 * Generate a new MongoDB-compatible ObjectId as a string
 * This ensures client-generated IDs are compatible with MongoDB's ObjectId format
 */
export function generateObjectId(): string {
  return new ObjectId().toString();
}
