"use client";

import { useState } from "react";
import { User, Phone, Mail, AlertTriangle, X } from "lucide-react";

export interface DuplicateContact {
  imported: {
    name: string;
    phone: string[];
    email: string[];
  };
  existing: {
    _id?: string;
    name: string;
    phone?: string[];
    email?: string[];
  };
}

export interface ContactDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicate: DuplicateContact | null;
  onMerge: (mergedContact: {
    name: string;
    phone: string[];
    email: string[];
    primaryPhone?: number;
    primaryEmail?: number;
  }) => void;
  onSkip: () => void;
  onCreateNew: () => void;
}

export function ContactDuplicateDialog({
  open,
  onOpenChange,
  duplicate,
  onMerge,
  onSkip,
  onCreateNew,
}: ContactDuplicateDialogProps) {
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [primaryPhone, setPrimaryPhone] = useState<string | null>(null);
  const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);

  if (!duplicate) return null;

  const { imported, existing } = duplicate;

  // Combine phones from both sources
  const existingPhones = existing.phone || [];
  const importedPhones = imported.phone || [];
  const allPhones = [...new Set([...existingPhones, ...importedPhones])];

  // Combine emails from both sources
  const existingEmails = existing.email || [];
  const importedEmails = imported.email || [];
  const allEmails = [...new Set([...existingEmails, ...importedEmails])];

  // Initialize selections when dialog opens
  if (open && selectedPhones.size === 0 && selectedEmails.size === 0) {
    if (allPhones.length > 0 || allEmails.length > 0) {
      setSelectedPhones(new Set(allPhones));
      setSelectedEmails(new Set(allEmails));
      setPrimaryPhone(allPhones[0] || null);
      setPrimaryEmail(allEmails[0] || null);
    }
  }

  const handleMerge = () => {
    const mergedPhones = Array.from(selectedPhones);
    const mergedEmails = Array.from(selectedEmails);

    // Find primary indices
    const primaryPhoneIdx = primaryPhone
      ? mergedPhones.indexOf(primaryPhone)
      : mergedPhones.length > 0
      ? 0
      : undefined;
    const primaryEmailIdx = primaryEmail
      ? mergedEmails.indexOf(primaryEmail)
      : mergedEmails.length > 0
      ? 0
      : undefined;

    onMerge({
      name: existing.name, // Keep existing name
      phone: mergedPhones,
      email: mergedEmails,
      primaryPhone: primaryPhoneIdx,
      primaryEmail: primaryEmailIdx,
    });

    // Reset state
    setSelectedPhones(new Set());
    setSelectedEmails(new Set());
    setPrimaryPhone(null);
    setPrimaryEmail(null);
  };

  const togglePhone = (phone: string) => {
    const newSet = new Set(selectedPhones);
    if (newSet.has(phone)) {
      newSet.delete(phone);
      if (primaryPhone === phone) setPrimaryPhone(null);
    } else {
      newSet.add(phone);
      if (!primaryPhone) setPrimaryPhone(phone);
    }
    setSelectedPhones(newSet);
  };

  const toggleEmail = (email: string) => {
    const newSet = new Set(selectedEmails);
    if (newSet.has(email)) {
      newSet.delete(email);
      if (primaryEmail === email) setPrimaryEmail(null);
    } else {
      newSet.add(email);
      if (!primaryEmail) setPrimaryEmail(email);
    }
    setSelectedEmails(newSet);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-semibold">Duplicate Contact Detected</h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            A contact with similar information already exists. Choose how to handle this:
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Existing Contact */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Existing Contact
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">{existing.name}</p>
                </div>

                {existingPhones.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone Numbers
                    </p>
                    {existingPhones.map((phone, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        {phone}
                      </p>
                    ))}
                  </div>
                )}

                {existingEmails.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Emails
                    </p>
                    {existingEmails.map((email, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        {email}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Imported Contact */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Imported Contact
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">{imported.name}</p>
                </div>

                {importedPhones.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone Numbers
                    </p>
                    {importedPhones.map((phone, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        {phone}
                        {!existingPhones.includes(phone) && (
                          <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">
                            New
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                )}

                {importedEmails.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Emails
                    </p>
                    {importedEmails.map((email, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        {email}
                        {!existingEmails.includes(email) && (
                          <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">
                            New
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Merge Options */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Merge Selection</h3>
            <p className="text-sm text-gray-600 mb-3">
              Select which contact information to keep:
            </p>

            {allPhones.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Phone Numbers</p>
                <div className="space-y-2">
                  {allPhones.map((phone) => (
                    <label key={phone} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPhones.has(phone)}
                        onChange={() => togglePhone(phone)}
                        className="rounded"
                      />
                      <span className="text-sm">{phone}</span>
                      {existingPhones.includes(phone) && importedPhones.includes(phone) && (
                        <span className="text-xs border border-gray-300 px-2 py-0.5 rounded">
                          Both
                        </span>
                      )}
                      {selectedPhones.has(phone) && (
                        <label className="flex items-center gap-1 ml-auto">
                          <input
                            type="radio"
                            name="primaryPhone"
                            checked={primaryPhone === phone}
                            onChange={() => setPrimaryPhone(phone)}
                            className="text-blue-600"
                          />
                          <span className="text-xs text-gray-600">Primary</span>
                        </label>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {allEmails.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Emails</p>
                <div className="space-y-2">
                  {allEmails.map((email) => (
                    <label key={email} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEmails.has(email)}
                        onChange={() => toggleEmail(email)}
                        className="rounded"
                      />
                      <span className="text-sm">{email}</span>
                      {existingEmails.includes(email) && importedEmails.includes(email) && (
                        <span className="text-xs border border-gray-300 px-2 py-0.5 rounded">
                          Both
                        </span>
                      )}
                      {selectedEmails.has(email) && (
                        <label className="flex items-center gap-1 ml-auto">
                          <input
                            type="radio"
                            name="primaryEmail"
                            checked={primaryEmail === email}
                            onChange={() => setPrimaryEmail(email)}
                            className="text-blue-600"
                          />
                          <span className="text-xs text-gray-600">Primary</span>
                        </label>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex flex-col sm:flex-row gap-2 justify-end">
          <button
            onClick={onSkip}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Skip Import
          </button>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Create as New Contact
          </button>
          <button
            onClick={handleMerge}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Merge and Update
          </button>
        </div>
      </div>
    </div>
  );
}
