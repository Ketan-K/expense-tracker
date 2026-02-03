/**
 * Contacts API utility for importing contacts from mobile device
 *
 * Supports:
 * - Web Contacts API (Chrome/Edge/Samsung Internet on Android)
 * - Capacitor Contacts Plugin (native Android apps)
 */

import { Capacitor } from "@capacitor/core";
import { Contacts } from "@capacitor-community/contacts";

// Define Capacitor Contact type based on the plugin's structure
export interface CapacitorContact {
  contactId: string;
  name?: {
    display?: string | null;
    given?: string | null;
    family?: string | null;
  };
  phones?: Array<{
    number?: string | null;
  }>;
  emails?: Array<{
    address?: string | null;
  }>;
}

export interface ContactResult {
  name?: string[];
  tel?: string[];
  email?: string[];
  address?: unknown[];
  icon?: Blob[];
}

/**
 * Check if the Web Contacts API is supported in the current browser
 */
export function isContactsAPISupported(): boolean {
  return "contacts" in navigator && "ContactsManager" in window;
}

/**
 * Check if running in a Capacitor native app
 */
export function isCapacitor(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if the browser is likely offline (no network connection)
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Open the device's contact picker and return selected contacts
 *
 * @param multiple - Allow selecting multiple contacts (default: true)
 * @param properties - Contact properties to request (default: ['name', 'tel', 'email'])
 * @returns Array of selected contacts
 * @throws Error if API not supported, user cancelled, or network unavailable
 */
export async function pickContacts(
  multiple: boolean = true,
  properties: string[] = ["name", "tel", "email"]
): Promise<ContactResult[]> {
  // Check browser support
  if (!isContactsAPISupported()) {
    throw new Error(
      "Contact Picker API is not supported in this browser. Please use Chrome/Edge on Android."
    );
  }

  // Check network connection (Contact Picker requires network)
  if (!isOnline()) {
    throw new Error(
      "Contact import requires an internet connection. Please connect to a network and try again."
    );
  }

  try {
    // Check which properties are available
    const availableProperties = await (navigator as any).contacts.getProperties();
    console.log("Available contact properties:", availableProperties);

    // Filter requested properties to only those available
    const validProperties = properties.filter(prop => availableProperties.includes(prop));

    if (validProperties.length === 0) {
      throw new Error("None of the requested contact properties are available");
    }

    // Open contact picker
    const contacts = await (navigator as any).contacts.select(validProperties, {
      multiple,
    });

    return contacts as ContactResult[];
  } catch (error: any) {
    // User cancelled the picker
    if (error.name === "AbortError") {
      throw new Error("Contact selection was cancelled");
    }

    // Permission denied or other error
    throw error;
  }
}

/**
 * Convert a ContactResult from the picker API to our Contact schema format
 * Handles multiple phone/email values and sets first as primary
 */
export function convertPickerContactToSchema(pickerContact: ContactResult): {
  name: string;
  phone: string[];
  email: string[];
  primaryPhone?: number;
  primaryEmail?: number;
  source: "imported";
  externalId?: string;
} {
  // Extract name (use first name if multiple)
  let name = "Unknown Contact";
  if (pickerContact.name && pickerContact.name.length > 0) {
    // Join name parts (firstName, lastName, etc.)
    name = pickerContact.name.join(" ").trim();
  }

  // Extract phone numbers
  const phone: string[] = pickerContact.tel || [];
  const primaryPhone = phone.length > 0 ? 0 : undefined;

  // Extract emails
  const email: string[] = pickerContact.email || [];
  const primaryEmail = email.length > 0 ? 0 : undefined;

  // Generate a pseudo-external ID (picker API doesn't provide stable contact IDs)
  const externalId = `picker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    name,
    phone,
    email,
    primaryPhone,
    primaryEmail,
    source: "imported" as const,
    externalId,
  };
}

/**
 * Check if two contacts are potential duplicates based on name, phone, or email
 */
export function isPotentialDuplicate(
  contact1: { name: string; phone?: string[]; email?: string[] },
  contact2: { name: string; phone?: string[]; email?: string[] }
): boolean {
  // Normalize names for comparison
  const name1 = contact1.name.toLowerCase().trim();
  const name2 = contact2.name.toLowerCase().trim();

  // Same name (exact match)
  if (name1 === name2) {
    return true;
  }

  // Check for matching phone numbers
  const phones1 = contact1.phone || [];
  const phones2 = contact2.phone || [];
  for (const p1 of phones1) {
    for (const p2 of phones2) {
      // Remove spaces, dashes, parentheses for comparison
      const cleanP1 = p1.replace(/[\\s\\-\\(\\)]/g, "");
      const cleanP2 = p2.replace(/[\\s\\-\\(\\)]/g, "");
      if (cleanP1 && cleanP2 && cleanP1 === cleanP2) {
        return true;
      }
    }
  }

  // Check for matching emails (case-insensitive)
  const emails1 = contact1.email || [];
  const emails2 = contact2.email || [];
  for (const e1 of emails1) {
    for (const e2 of emails2) {
      if (e1.toLowerCase() === e2.toLowerCase()) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Batch import multiple contacts, checking for duplicates
 *
 * @param existingContacts - Array of existing contacts to check against
 * @returns Object with imported contacts and duplicates found
 */
export async function importContactsBatch(
  existingContacts: Array<{ name: string; phone?: string[]; email?: string[] }>
): Promise<{
  imported: ReturnType<typeof convertPickerContactToSchema>[];
  duplicates: Array<{
    pickerContact: ContactResult;
    convertedContact: ReturnType<typeof convertPickerContactToSchema>;
    existingContact: { name: string; phone?: string[]; email?: string[] };
  }>;
}> {
  // Open contact picker for multiple selection
  const pickerContacts = await pickContacts(true, ["name", "tel", "email"]);

  const imported: ReturnType<typeof convertPickerContactToSchema>[] = [];
  const duplicates: Array<{
    pickerContact: ContactResult;
    convertedContact: ReturnType<typeof convertPickerContactToSchema>;
    existingContact: { name: string; phone?: string[]; email?: string[] };
  }> = [];

  for (const pickerContact of pickerContacts) {
    const converted = convertPickerContactToSchema(pickerContact);

    // Check if this is a potential duplicate
    const duplicate = existingContacts.find(existing => isPotentialDuplicate(converted, existing));

    if (duplicate) {
      duplicates.push({
        pickerContact,
        convertedContact: converted,
        existingContact: duplicate,
      });
    } else {
      imported.push(converted);
    }
  }

  return { imported, duplicates };
}

/**
 * Request contacts permission for Capacitor native app
 */
export async function requestContactsPermission(): Promise<boolean> {
  if (!isCapacitor()) {
    return false;
  }

  try {
    const permission = await Contacts.requestPermissions();
    return permission.contacts === "granted";
  } catch (error) {
    console.error("Failed to request contacts permission:", error);
    return false;
  }
}

/**
 * Fetch all device contacts using Capacitor plugin (native only)
 * Does NOT include photos to save storage
 */
export async function fetchAllDeviceContacts(): Promise<CapacitorContact[]> {
  if (!isCapacitor()) {
    throw new Error("Capacitor Contacts plugin is only available in native apps");
  }

  try {
    const result = await Contacts.getContacts({
      projection: {
        name: true,
        phones: true,
        emails: true,
        // Exclude photos to save storage
        image: false,
      },
    });

    return result.contacts;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to access device contacts: " + errorMessage);
  }
}

/**
 * Convert Capacitor contact to our Contact schema format
 */
export function convertCapacitorContactToSchema(contact: CapacitorContact): {
  name: string;
  phone: string[];
  email: string[];
  primaryPhone?: number;
  primaryEmail?: number;
  source: "imported";
  externalId: string;
} {
  // Extract name
  const name =
    contact.name?.display || contact.name?.given || contact.name?.family || "Unknown Contact";

  // Extract phone numbers
  const phone: string[] = contact.phones?.map(p => p.number || "").filter(Boolean) || [];
  const primaryPhone = phone.length > 0 ? 0 : undefined;

  // Extract emails
  const email: string[] = contact.emails?.map(e => e.address || "").filter(Boolean) || [];
  const primaryEmail = email.length > 0 ? 0 : undefined;

  // Use stable contact ID from device
  const externalId =
    contact.contactId || `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    name: name.trim(),
    phone,
    email,
    primaryPhone,
    primaryEmail,
    source: "imported" as const,
    externalId,
  };
}

/**
 * Sync all device contacts to IndexedDB and return statistics
 * Handles duplicate detection by externalId and phone/email matching
 *
 * @param userId - Current user's ID
 * @param db - Dexie database instance
 * @param existingContacts - Array of existing contacts to check against
 * @param onProgress - Optional callback for progress updates (current, total)
 * @returns Statistics about synced and skipped contacts
 */
export async function syncAllDeviceContacts(
  userId: string,
  db: any,
  existingContacts: Array<{
    _id?: any;
    externalId?: string;
    name: string;
    phone?: string[];
    email?: string[];
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<{ synced: number; updated: number; skipped: number }> {
  if (!isCapacitor()) {
    throw new Error("Contact sync is only available in native apps");
  }

  // Fetch all device contacts
  const deviceContacts = await fetchAllDeviceContacts();
  const total = deviceContacts.length;
  let synced = 0;
  let updated = 0;
  let skipped = 0;

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < deviceContacts.length; i += BATCH_SIZE) {
    const batch = deviceContacts.slice(i, i + BATCH_SIZE);

    for (const deviceContact of batch) {
      const current = i + batch.indexOf(deviceContact) + 1;
      onProgress?.(current, total);

      const converted = convertCapacitorContactToSchema(deviceContact);

      // Skip contacts without name or contact info
      if (!converted.name || (converted.phone.length === 0 && converted.email.length === 0)) {
        skipped++;
        continue;
      }

      // Check for existing contact by externalId first
      const existingByExternalId = existingContacts.find(
        c => c.externalId === converted.externalId
      );

      if (existingByExternalId) {
        // Update if name/phone/email changed
        const hasChanges =
          existingByExternalId.name !== converted.name ||
          JSON.stringify(existingByExternalId.phone) !== JSON.stringify(converted.phone) ||
          JSON.stringify(existingByExternalId.email) !== JSON.stringify(converted.email);

        if (hasChanges) {
          await db.contacts.update(existingByExternalId._id, {
            name: converted.name,
            phone: converted.phone,
            email: converted.email,
            primaryPhone: converted.primaryPhone,
            primaryEmail: converted.primaryEmail,
            updatedAt: new Date(),
            synced: false, // Mark for server sync
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      // Check for duplicates by phone/email
      const duplicate = existingContacts.find(existing =>
        isPotentialDuplicate(converted, existing)
      );

      if (duplicate) {
        // Update externalId for existing duplicate
        await db.contacts.update(duplicate._id, {
          externalId: converted.externalId,
          updatedAt: new Date(),
        });
        skipped++;
        continue;
      }

      // Add new contact
      await db.contacts.add({
        userId,
        name: converted.name,
        phone: converted.phone,
        email: converted.email,
        primaryPhone: converted.primaryPhone,
        primaryEmail: converted.primaryEmail,
        source: converted.source,
        externalId: converted.externalId,
        synced: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      synced++;
    }
  }

  return { synced, updated, skipped };
}
