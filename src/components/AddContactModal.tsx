"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Smartphone, RefreshCw, Users } from "lucide-react";
import { db, LocalContact } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { generateObjectId } from "@/lib/idGenerator";
import {
  isContactsAPISupported,
  isCapacitor,
  pickContacts,
  convertPickerContactToSchema,
  isPotentialDuplicate,
  requestContactsPermission,
  syncAllDeviceContacts,
} from "@/lib/contactsApi";
import { ContactDuplicateDialog, DuplicateContact } from "./ContactDuplicateDialog";
import { t } from "@/lib/terminology";
import { AnimatePresence, motion } from "framer-motion";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AddContactModal({ isOpen, onClose, userId }: AddContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phones: [""],
    emails: [""],
    primaryPhone: 0,
    primaryEmail: 0,
    relationship: "",
  });
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    duplicate: DuplicateContact | null;
  }>({ open: false, duplicate: null });
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  const contactsSupported = typeof window !== "undefined" && isContactsAPISupported();
  const isNativeApp = typeof window !== "undefined" && isCapacitor();

  // Auto-sync contacts on first launch (native app only)
  useEffect(() => {
    if (!isNativeApp || !isOpen) return;

    const checkAutoSync = async () => {
      const lastSync = localStorage.getItem("contactsLastSynced");
      const shouldAutoSync = !lastSync || Date.now() - parseInt(lastSync) > 7 * 24 * 60 * 60 * 1000; // 7 days

      if (shouldAutoSync && !lastSync) {
        // First time - show welcome message
        setTimeout(() => {
          void handleSyncAllContacts();
        }, 500);
      } else if (shouldAutoSync) {
        // Weekly sync - do it in background
        void handleSyncAllContacts(true);
      }
    };

    void checkAutoSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNativeApp, isOpen]);

  const handleSyncAllContacts = async (silent = false) => {
    if (!isNativeApp) {
      toast.error("Contact sync is only available in the mobile app");
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0 });

    try {
      // Request permission
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        toast.error("Contacts permission denied. Enable it in Settings to sync contacts.");
        return;
      }

      if (!silent) {
        toast.info("Syncing contacts from your device...");
      }

      // Fetch existing contacts
      const existingContacts = await db.contacts.where("userId").equals(userId).toArray();

      // Sync all device contacts
      const result = await syncAllDeviceContacts(userId, db, existingContacts, (current, total) => {
        setSyncProgress({ current, total });
      });

      // Store sync timestamp
      localStorage.setItem("contactsLastSynced", Date.now().toString());

      // Show success message
      const message = `✓ ${result.synced} contacts synced, ${result.updated} updated${result.skipped > 0 ? `, ${result.skipped} skipped` : ""}`;
      toast.success(message);

      // Trigger background sync to server
      if (navigator.onLine) {
        processSyncQueue(userId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sync contacts";
      console.error("Contact sync error:", error);
      if (!silent) {
        toast.error(errorMessage);
      }
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  };

  const handleImportContact = async () => {
    setIsImporting(true);
    try {
      const pickerContacts = await pickContacts(false); // Single selection
      if (pickerContacts.length === 0) return;

      const converted = convertPickerContactToSchema(pickerContacts[0]);

      // Check for duplicates
      const existingContacts = await db.contacts.where("userId").equals(userId).toArray();
      const duplicate = existingContacts.find(existing =>
        isPotentialDuplicate(converted, {
          name: existing.name,
          phone: existing.phone,
          email: existing.email,
        })
      );

      if (duplicate) {
        setDuplicateDialog({
          open: true,
          duplicate: {
            imported: converted,
            existing: duplicate,
          },
        });
      } else {
        // Pre-fill form with imported data
        setFormData({
          name: converted.name,
          phones: converted.phone.length > 0 ? converted.phone : [""],
          emails: converted.email.length > 0 ? converted.email : [""],
          primaryPhone: converted.primaryPhone ?? 0,
          primaryEmail: converted.primaryEmail ?? 0,
          relationship: "",
        });
        toast.success("Contact imported! Review and save.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("cancelled")) {
        toast.info("Import cancelled");
      } else if (errorMessage.includes("not supported")) {
        toast.error("Contact import only works on Chrome/Edge for Android");
      } else if (errorMessage.includes("internet connection")) {
        toast.error(errorMessage);
      } else {
        toast.error("Failed to import contact");
        console.error(error);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleMergeDuplicate = async (mergedContact: any) => {
    if (!duplicateDialog.duplicate?.existing._id) return;

    try {
      const now = new Date();
      await db.contacts.update(duplicateDialog.duplicate.existing._id, {
        ...mergedContact,
        source: "imported",
        updatedAt: now,
        synced: false,
      });

      await db.syncQueue.add({
        action: "UPDATE",
        collection: "contacts",
        data: {
          _id: duplicateDialog.duplicate.existing._id,
          ...mergedContact,
          updatedAt: now,
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: duplicateDialog.duplicate.existing._id,
        remoteId: duplicateDialog.duplicate.existing._id,
      });

      toast.success("Contact merged successfully!");
      if (navigator.onLine) processSyncQueue(userId);

      setDuplicateDialog({ open: false, duplicate: null });
      onClose();
    } catch (error) {
      console.error("Error merging contact:", error);
      toast.error("Failed to merge contact");
    }
  };

  const handleCreateNewFromDuplicate = () => {
    if (!duplicateDialog.duplicate) return;

    const { imported } = duplicateDialog.duplicate;
    setFormData({
      name: imported.name,
      phones: imported.phone.length > 0 ? imported.phone : [""],
      emails: imported.email.length > 0 ? imported.email : [""],
      primaryPhone: 0,
      primaryEmail: 0,
      relationship: "",
    });
    setDuplicateDialog({ open: false, duplicate: null });
    toast.info("Create as new contact");
  };

  const addPhoneField = () => {
    setFormData({ ...formData, phones: [...formData.phones, ""] });
  };

  const removePhoneField = (index: number) => {
    const newPhones = formData.phones.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      phones: newPhones.length > 0 ? newPhones : [""],
      primaryPhone: formData.primaryPhone >= newPhones.length ? 0 : formData.primaryPhone,
    });
  };

  const updatePhone = (index: number, value: string) => {
    const newPhones = [...formData.phones];
    newPhones[index] = value;
    setFormData({ ...formData, phones: newPhones });
  };

  const addEmailField = () => {
    setFormData({ ...formData, emails: [...formData.emails, ""] });
  };

  const removeEmailField = (index: number) => {
    const newEmails = formData.emails.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      emails: newEmails.length > 0 ? newEmails : [""],
      primaryEmail: formData.primaryEmail >= newEmails.length ? 0 : formData.primaryEmail,
    });
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...formData.emails];
    newEmails[index] = value;
    setFormData({ ...formData, emails: newEmails });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      // Check for duplicate name
      const existing = await db.contacts
        .where("userId")
        .equals(userId)
        .and(c => c.name.toLowerCase() === formData.name.toLowerCase())
        .first();

      if (existing) {
        toast.error("A contact with this name already exists");
        setIsSubmitting(false);
        return;
      }

      const contactId = generateObjectId();
      const now = new Date();

      // Filter out empty values and deduplicate
      const phones = [...new Set(formData.phones.filter(p => p.trim()))];
      const emails = [...new Set(formData.emails.filter(e => e.trim()))];

      const contact: LocalContact = {
        _id: contactId,
        userId: userId,
        name: formData.name.trim(),
        phone: phones,
        email: emails,
        primaryPhone:
          phones.length > 0 ? Math.min(formData.primaryPhone, phones.length - 1) : undefined,
        primaryEmail:
          emails.length > 0 ? Math.min(formData.primaryEmail, emails.length - 1) : undefined,
        relationship: formData.relationship.trim() || undefined,
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

      toast.success("Contact created successfully!");

      if (navigator.onLine) {
        processSyncQueue(userId);
      }

      // Reset form
      setFormData({
        name: "",
        phones: [""],
        emails: [""],
        primaryPhone: 0,
        primaryEmail: 0,
        relationship: "",
      });

      onClose();
    } catch (error) {
      console.error("Error creating contact:", error);
      toast.error("Failed to create contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20 sm:pb-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-gradient-to-br from-app-contacts-light to-app-contacts-light-end dark:from-gray-800 dark:via-gray-800 dark:to-app-contacts-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto my-auto shadow-2xl"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t.add} {t.contacts}
              </h2>
              <div className="flex items-center gap-2">
                {isNativeApp && (
                  <button
                    type="button"
                    onClick={() => handleSyncAllContacts(false)}
                    disabled={isSyncing}
                    className="px-3 py-2 bg-gradient-to-r from-app-contacts to-app-contacts-end text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    title="Sync all contacts from device"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {syncProgress.total > 0
                          ? `${syncProgress.current}/${syncProgress.total}`
                          : "Syncing..."}
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        Sync All
                      </>
                    )}
                  </button>
                )}
                {!isNativeApp && contactsSupported && (
                  <button
                    type="button"
                    onClick={handleImportContact}
                    disabled={isImporting || !navigator.onLine}
                    className="px-3 py-2 bg-gradient-to-r from-app-contacts to-app-contacts-end text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    title={
                      !navigator.onLine
                        ? "Import requires internet connection"
                        : "Import from phone contacts"
                    }
                  >
                    <Smartphone className="w-4 h-4" />
                    {isImporting ? "Importing..." : "Import"}
                  </button>
                )}
                <motion.button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </div>
            </div>

            {isSyncing && syncProgress.total > 0 && (
              <div className="px-6 pb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                      Syncing contacts...
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {syncProgress.current} / {syncProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-app-contacts to-app-contacts-end h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Phone Numbers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Numbers
                </label>
                <div className="space-y-2">
                  {formData.phones.map((phone, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => updatePhone(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Phone number"
                      />
                      {formData.phones.filter(p => p.trim()).length > 1 && (
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name="primaryPhone"
                            checked={formData.primaryPhone === index}
                            onChange={() => setFormData({ ...formData, primaryPhone: index })}
                            className="text-[var(--color-app-gradient-from)]"
                          />
                          <span className="text-gray-600 dark:text-gray-400">Primary</span>
                        </label>
                      )}
                      {formData.phones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhoneField(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPhoneField}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-[var(--color-app-gradient-from)] hover:text-[var(--color-app-gradient-from)] dark:hover:text-purple-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Phone
                  </button>
                </div>
              </div>

              {/* Email Addresses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Addresses
                </label>
                <div className="space-y-2">
                  {formData.emails.map((email, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="email"
                        value={email}
                        onChange={e => updateEmail(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Email address"
                      />
                      {formData.emails.filter(e => e.trim()).length > 1 && (
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name="primaryEmail"
                            checked={formData.primaryEmail === index}
                            onChange={() => setFormData({ ...formData, primaryEmail: index })}
                            className="text-[var(--color-app-gradient-from)]"
                          />
                          <span className="text-gray-600 dark:text-gray-400">Primary</span>
                        </label>
                      )}
                      {formData.emails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmailField(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEmailField}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-[var(--color-app-gradient-from)] hover:text-[var(--color-app-gradient-from)] dark:hover:text-purple-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Email
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={formData.relationship}
                  onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                  placeholder="e.g., Friend, Family, Colleague"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-app-contacts to-app-contacts-end text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add Contact"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      <ContactDuplicateDialog
        open={duplicateDialog.open}
        onOpenChange={(open: boolean) => setDuplicateDialog({ ...duplicateDialog, open })}
        duplicate={duplicateDialog.duplicate}
        onMerge={handleMergeDuplicate}
        onSkip={() => setDuplicateDialog({ open: false, duplicate: null })}
        onCreateNew={handleCreateNewFromDuplicate}
      />
    </AnimatePresence>
  );
}
