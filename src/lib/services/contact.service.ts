/**
 * Contact Business Service
 * Orchestrates contact operations with validation and business logic
 */

import { getDatabaseServiceForUser, BaseContact } from "./database";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError, ValidationError, NotFoundError } from "@/lib/core/errors";
import { validateContact } from "@/lib/validation";
import { logger } from "@/lib/core/logger";

export class ContactService {
  async getContacts(userId: string): Promise<Result<BaseContact[], DatabaseError>> {
    logger.debug("Fetching contacts", { userId });
    const db = await getDatabaseServiceForUser(userId);
    return await db.contacts.findByUserId(userId);
  }

  async getContactById(id: string, userId: string): Promise<Result<BaseContact, DatabaseError | NotFoundError>> {
    logger.debug("Fetching contact by ID", { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    const result = await db.contacts.findById(id, userId);
    
    if (result.isFailure()) return result;
    if (!result.value) return fail(new NotFoundError("Contact not found", "contact"));
    
    return ok(result.value);
  }

  async searchContactsByName(userId: string, name: string): Promise<Result<BaseContact[], DatabaseError>> {
    logger.debug("Searching contacts by name", { userId, name });
    const db = await getDatabaseServiceForUser(userId);
    return await db.contacts.findByName(userId, name);
  }

  async createContact(
    userId: string,
    contactData: Omit<BaseContact, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Result<BaseContact, DatabaseError | ValidationError>> {
    // Validate input
    const validation = validateContact(contactData);
    if (!validation.isValid) {
      logger.warn("Contact validation failed", { userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join("; ")));
    }

    logger.info("Creating contact", { userId, name: contactData.name });
    const db = await getDatabaseServiceForUser(userId);
    return await db.contacts.create({
      ...validation.sanitized,
      userId,
    });
  }

  async updateContact(
    id: string,
    userId: string,
    contactData: Partial<Omit<BaseContact, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<Result<BaseContact, DatabaseError | ValidationError | NotFoundError>> {
    // Check if contact exists
    const db = await getDatabaseServiceForUser(userId);
    const existingResult = await db.contacts.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError("Contact not found", "contact"));

    // Validate update data
    const merged = { ...existingResult.value, ...contactData };
    const validation = validateContact(merged);
    if (!validation.isValid) {
      logger.warn("Contact update validation failed", { id, userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join("; ")));
    }

    logger.info("Updating contact", { id, userId });
    return await db.contacts.update(id, userId, contactData);
  }

  async deleteContact(id: string, userId: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    logger.info("Deleting contact", { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    
    // Check if exists first
    const existingResult = await db.contacts.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError("Contact not found", "contact"));

    return await db.contacts.delete(id, userId);
  }
}

export const contactService = new ContactService();
