/**
 * MongoDB Contact Repository Implementation
 */

import { ObjectId } from 'mongodb';
import { IContactRepository, BaseContact } from '../../interface';
import { Result, ok, fail } from '@/lib/core/result';
import { DatabaseError } from '@/lib/core/errors';
import { getMongoClient, handleMongoError } from '../client';

export class MongoDBContactRepository implements IContactRepository {
  private async getCollection() {
    const client = await getMongoClient();
    return client.db().collection('contacts');
  }

  async findByUserId(userId: string): Promise<Result<BaseContact[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const contacts = await collection
        .find({ userId })
        .sort({ name: 1 })
        .toArray();

      const result: BaseContact[] = contacts.map(contact => ({
        id: contact._id.toString(),
        userId: contact.userId,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        primaryPhone: contact.primaryPhone,
        primaryEmail: contact.primaryEmail,
        relationship: contact.relationship,
        notes: contact.notes,
        source: contact.source,
        externalId: contact.externalId,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError('Failed to fetch contacts', handleMongoError(error, 'findByUserId')));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseContact | null, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const contact = await collection.findOne({
        _id: new ObjectId(id),
        userId,
      });

      if (!contact) {
        return ok(null);
      }

      const result: BaseContact = {
        id: contact._id.toString(),
        userId: contact.userId,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        primaryPhone: contact.primaryPhone,
        primaryEmail: contact.primaryEmail,
        relationship: contact.relationship,
        notes: contact.notes,
        source: contact.source,
        externalId: contact.externalId,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      };

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError('Failed to fetch contact', handleMongoError(error, 'findById')));
    }
  }

  async findByName(userId: string, name: string): Promise<Result<BaseContact[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const contacts = await collection
        .find({
          userId,
          name: { $regex: name, $options: 'i' },
        })
        .sort({ name: 1 })
        .toArray();

      const result: BaseContact[] = contacts.map(contact => ({
        id: contact._id.toString(),
        userId: contact.userId,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        primaryPhone: contact.primaryPhone,
        primaryEmail: contact.primaryEmail,
        relationship: contact.relationship,
        notes: contact.notes,
        source: contact.source,
        externalId: contact.externalId,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError('Failed to search contacts', handleMongoError(error, 'findByName')));
    }
  }

  async create(contact: Omit<BaseContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<BaseContact, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const document = {
        ...contact,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(document);

      const created: BaseContact = {
        id: result.insertedId.toString(),
        ...contact,
        createdAt: now,
        updatedAt: now,
      };

      return ok(created);
    } catch (error) {
      return fail(new DatabaseError('Failed to create contact', handleMongoError(error, 'create')));
    }
  }

  async update(id: string, userId: string, contact: Partial<BaseContact>): Promise<Result<BaseContact, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const { id: _, createdAt, ...updateData } = contact;

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id), userId },
        { 
          $set: { 
            ...updateData,
            updatedAt: now 
          } 
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        return fail(new DatabaseError('Contact not found or unauthorized'));
      }

      const updated: BaseContact = {
        id: result._id.toString(),
        userId: result.userId,
        name: result.name,
        phone: result.phone,
        email: result.email,
        primaryPhone: result.primaryPhone,
        primaryEmail: result.primaryEmail,
        relationship: result.relationship,
        notes: result.notes,
        source: result.source,
        externalId: result.externalId,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      return ok(updated);
    } catch (error) {
      return fail(new DatabaseError('Failed to update contact', handleMongoError(error, 'update')));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
        userId,
      });

      if (result.deletedCount === 0) {
        return fail(new DatabaseError('Contact not found or unauthorized'));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError('Failed to delete contact', handleMongoError(error, 'delete')));
    }
  }
}
