"use client";

import { useState } from "react";
import { Search, UserPlus, User, Phone, Mail, X } from "lucide-react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { generateObjectId } from "@/lib/idGenerator";
import { processSyncQueue } from "@/lib/syncUtils";
import { useLiveQuery } from "dexie-react-hooks";

interface ContactSelectorProps {
  value?: string; // contactId
  contactName?: string;
  onChange: (contactId: string | undefined, contactName: string) => void;
  userId: string;
  label?: string;
  required?: boolean;
}

export default function ContactSelector({
  value: _value,
  contactName,
  onChange,
  userId,
  label = "Contact",
  required = true,
}: ContactSelectorProps) {
  const [searchTerm, setSearchTerm] = useState(contactName || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "",
    notes: "",
  });

  // Load contacts from IndexedDB
  const contacts = useLiveQuery(async () => {
    if (!userId) return [];
    return await db.contacts.where("userId").equals(userId).sortBy("name");
  }, [userId]);

  const filteredContacts = contacts?.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectContact = (contact: LocalContact) => {
    onChange(contact._id, contact.name);
    setSearchTerm(contact.name);
    setShowDropdown(false);
  };

  const handleCreateContact = async () => {
    if (!newContact.name.trim()) {
      toast.error("Please enter a contact name");
      return;
    }

    // Check if contact already exists
    const existing = contacts?.find(
      c => c.name.toLowerCase() === newContact.name.trim().toLowerCase()
    );

    if (existing) {
      toast.error("Contact already exists");
      handleSelectContact(existing);
      setShowCreateForm(false);
      return;
    }

    try {
      const contactId = generateObjectId();
      const now = new Date();

      // Convert single values to arrays
      const phones = newContact.phone.trim() ? [newContact.phone.trim()] : [];
      const emails = newContact.email.trim() ? [newContact.email.trim()] : [];

      const contact: LocalContact = {
        _id: contactId,
        userId: userId,
        name: newContact.name.trim(),
        phone: phones,
        email: emails,
        primaryPhone: phones.length > 0 ? 0 : undefined,
        primaryEmail: emails.length > 0 ? 0 : undefined,
        relationship: newContact.relationship || undefined,
        notes: newContact.notes.trim() || undefined,
        source: "manual",
        synced: false,
        createdAt: now,
        updatedAt: now,
      };

      await db.contacts.add(contact);

      await db.syncQueue.add({
        action: "CREATE",
        collection: "contacts",
        data: contact,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: contactId,
      });

      onChange(contactId, contact.name);
      setSearchTerm(contact.name);
      setNewContact({ name: "", phone: "", email: "", relationship: "", notes: "" });
      setShowCreateForm(false);

      toast.success("Contact created!");

      if (navigator.onLine && userId) {
        processSyncQueue(userId);
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      toast.error("Failed to create contact");
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <User className="w-4 h-4 inline mr-2 text-[var(--color-app-gradient-from)]" />
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          placeholder="Search or select contact..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) {
              onChange(undefined, "");
            }
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all pr-10"
          required={required}
        />
        <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {/* Create new contact button */}
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(true);
                setShowDropdown(false);
                setNewContact({ ...newContact, name: searchTerm });
              }}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b dark:border-gray-700"
            >
              <UserPlus className="w-5 h-5 text-[var(--color-app-gradient-from)]" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Create new contact {searchTerm && `"${searchTerm}"`}
              </span>
            </button>

            {/* Contact list */}
            {filteredContacts && filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <button
                  key={contact._id}
                  type="button"
                  onClick={() => handleSelectContact(contact)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b last:border-b-0 dark:border-gray-700"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-[var(--color-app-gradient-from)]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{contact.name}</div>
                    {contact.phone && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {contact.phone}
                      </div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No contacts found
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Contact Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Contact
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="Enter name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="Email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Relationship
                </label>
                <select
                  value={newContact.relationship}
                  onChange={e => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="friend">Friend</option>
                  <option value="family">Family</option>
                  <option value="business">Business</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateContact}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-app-gradient-from to-app-gradient-to text-white rounded-lg hover:brightness-110 transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
