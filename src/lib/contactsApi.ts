/**
 * Web Contacts API utility for importing contacts from mobile device
 * 
 * Browser Support:
 * - Chrome/Edge/Samsung Internet on Android only
 * - Not supported on iOS, desktop, or Firefox
 * - Requires HTTPS (production) or localhost (development)
 */

export interface ContactResult {
  name?: string[];
  tel?: string[];
  email?: string[];
  address?: any[];
  icon?: Blob[];
}

/**
 * Check if the Web Contacts API is supported in the current browser
 */
export function isContactsAPISupported(): boolean {
  return 'contacts' in navigator && 'ContactsManager' in window;
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
  properties: string[] = ['name', 'tel', 'email']
): Promise<ContactResult[]> {
  // Check browser support
  if (!isContactsAPISupported()) {
    throw new Error('Contact Picker API is not supported in this browser. Please use Chrome/Edge on Android.');
  }

  // Check network connection (Contact Picker requires network)
  if (!isOnline()) {
    throw new Error('Contact import requires an internet connection. Please connect to a network and try again.');
  }

  try {
    // Check which properties are available
    const availableProperties = await (navigator as any).contacts.getProperties();
    console.log('Available contact properties:', availableProperties);

    // Filter requested properties to only those available
    const validProperties = properties.filter(prop => availableProperties.includes(prop));

    if (validProperties.length === 0) {
      throw new Error('None of the requested contact properties are available');
    }

    // Open contact picker
    const contacts = await (navigator as any).contacts.select(validProperties, {
      multiple,
    });

    return contacts as ContactResult[];
  } catch (error: any) {
    // User cancelled the picker
    if (error.name === 'AbortError') {
      throw new Error('Contact selection was cancelled');
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
  source: 'imported';
  externalId?: string;
} {
  // Extract name (use first name if multiple)
  let name = 'Unknown Contact';
  if (pickerContact.name && pickerContact.name.length > 0) {
    // Join name parts (firstName, lastName, etc.)
    name = pickerContact.name.join(' ').trim();
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
    source: 'imported' as const,
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
      const cleanP1 = p1.replace(/[\\s\\-\\(\\)]/g, '');
      const cleanP2 = p2.replace(/[\\s\\-\\(\\)]/g, '');
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
  const pickerContacts = await pickContacts(true, ['name', 'tel', 'email']);

  const imported: ReturnType<typeof convertPickerContactToSchema>[] = [];
  const duplicates: Array<{
    pickerContact: ContactResult;
    convertedContact: ReturnType<typeof convertPickerContactToSchema>;
    existingContact: { name: string; phone?: string[]; email?: string[] };
  }> = [];

  for (const pickerContact of pickerContacts) {
    const converted = convertPickerContactToSchema(pickerContact);

    // Check if this is a potential duplicate
    const duplicate = existingContacts.find(existing =>
      isPotentialDuplicate(converted, existing)
    );

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
