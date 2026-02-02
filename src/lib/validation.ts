import validator from "validator";
import { ObjectId } from "mongodb";

// Lazy load DOMPurify only when needed (client-side)
let DOMPurify: any = null;
if (typeof window !== 'undefined') {
  import('isomorphic-dompurify').then(module => {
    DOMPurify = module.default;
  });
}

/**
 * Sanitize string input by removing HTML/scripts
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  
  // Server-side: use simple sanitization
  if (typeof window === 'undefined' || !DOMPurify) {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  
  // Client-side: use DOMPurify
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}

/**
 * Validate and sanitize expense input data
 */
export function validateExpense(data: {
  date?: any;
  amount?: any;
  category?: any;
  description?: any;
  paymentMethod?: any;
  type?: any;
}): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];

  // Validate date
  if (!data.date) {
    errors.push("Date is required");
  } else {
    const dateStr = String(data.date);
    if (!validator.isISO8601(dateStr) && !validator.isDate(dateStr)) {
      errors.push("Invalid date format");
    }
  }

  // Validate amount
  if (data.amount === undefined || data.amount === null) {
    errors.push("Amount is required");
  } else {
    const amount = parseFloat(String(data.amount));
    if (isNaN(amount) || amount <= 0) {
      errors.push("Amount must be a positive number");
    }
    if (amount > 10000000) {
      errors.push("Amount is unreasonably large");
    }
  }

  // Validate category
  if (!data.category) {
    errors.push("Category is required");
  } else if (typeof data.category !== "string") {
    errors.push("Category must be a string");
  } else if (data.category.length > 50) {
    errors.push("Category name too long (max 50 characters)");
  }

  // Validate description (optional)
  if (data.description && typeof data.description === "string") {
    if (data.description.length > 500) {
      errors.push("Description too long (max 500 characters)");
    }
  }

  // Validate payment method (optional)
  if (data.paymentMethod) {
    const validMethods = ["cash", "card", "upi", ""];
    if (!validMethods.includes(String(data.paymentMethod))) {
      errors.push("Invalid payment method");
    }
  }

  // Validate type (optional for backward compatibility)
  if (data.type) {
    const validTypes = ["expense", "income"];
    if (!validTypes.includes(String(data.type))) {
      errors.push("Invalid transaction type");
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Return sanitized data
  return {
    isValid: true,
    errors: [],
    sanitized: {
      date: new Date(data.date),
      amount: parseFloat(String(data.amount)),
      category: sanitizeString(String(data.category)),
      description: data.description ? sanitizeString(String(data.description)) : "",
      paymentMethod: data.paymentMethod ? sanitizeString(String(data.paymentMethod)) : "",
      type: data.type ? sanitizeString(String(data.type)) : "expense", // Default to expense
    },
  };
}

/**
 * Validate and sanitize category input data
 */
export function validateCategory(data: {
  name?: any;
  icon?: any;
  color?: any;
}): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];

  // Validate name
  if (!data.name) {
    errors.push("Category name is required");
  } else if (typeof data.name !== "string") {
    errors.push("Category name must be a string");
  } else if (data.name.length < 2) {
    errors.push("Category name too short (min 2 characters)");
  } else if (data.name.length > 50) {
    errors.push("Category name too long (max 50 characters)");
  } else if (!/^[a-zA-Z0-9\s-]+$/.test(data.name)) {
    errors.push("Category name contains invalid characters");
  }

  // Validate icon
  if (!data.icon) {
    errors.push("Icon is required");
  } else if (typeof data.icon !== "string") {
    errors.push("Icon must be a string");
  } else if (data.icon.length > 50) {
    errors.push("Icon name too long");
  }

  // Validate color
  if (!data.color) {
    errors.push("Color is required");
  } else if (!validator.isHexColor(String(data.color))) {
    errors.push("Invalid color format (must be hex color)");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      name: sanitizeString(String(data.name)),
      icon: sanitizeString(String(data.icon)),
      color: String(data.color).toLowerCase(),
    },
  };
}

/**
 * Validate and sanitize budget input data
 */
export function validateBudget(data: {
  categoryId?: any;
  amount?: any;
  month?: any;
}): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];

  // Validate categoryId
  if (!data.categoryId) {
    errors.push("Category ID is required");
  } else if (typeof data.categoryId !== "string") {
    errors.push("Category ID must be a string");
  }

  // Validate amount
  if (data.amount === undefined || data.amount === null) {
    errors.push("Amount is required");
  } else {
    const amount = parseFloat(String(data.amount));
    if (isNaN(amount) || amount <= 0) {
      errors.push("Amount must be a positive number");
    }
    if (amount > 10000000) {
      errors.push("Amount is unreasonably large");
    }
  }

  // Validate month format (YYYY-MM)
  if (!data.month) {
    errors.push("Month is required");
  } else if (!validator.matches(String(data.month), /^\d{4}-(0[1-9]|1[0-2])$/)) {
    errors.push("Invalid month format (must be YYYY-MM)");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      categoryId: sanitizeString(String(data.categoryId)),
      amount: parseFloat(String(data.amount)),
      month: String(data.month),
    },
  };
}

/**
 * Validate query parameters
 */
export function validateQueryParams(params: {
  startDate?: string | null;
  endDate?: string | null;
  category?: string | null;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.startDate) {
    if (!validator.isISO8601(params.startDate) && !validator.isDate(params.startDate)) {
      errors.push("Invalid startDate format");
    }
  }

  if (params.endDate) {
    if (!validator.isISO8601(params.endDate) && !validator.isDate(params.endDate)) {
      errors.push("Invalid endDate format");
    }
  }

  if (params.category) {
    if (params.category.length > 50) {
      errors.push("Category parameter too long");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate MongoDB ObjectId format
 */
export function sanitizeObjectId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return ObjectId.isValid(id);
}

/**
 * Validate and sanitize income input data
 */
export function validateIncome(data: {
  date?: any;
  amount?: any;
  source?: any;
  category?: any;
  description?: any;
  taxable?: any;
  recurring?: any;
}): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];

  // Validate date
  if (!data.date) {
    errors.push("Date is required");
  } else {
    const dateStr = String(data.date);
    if (!validator.isISO8601(dateStr) && !validator.isDate(dateStr)) {
      errors.push("Invalid date format");
    }
  }

  // Validate amount
  if (data.amount === undefined || data.amount === null) {
    errors.push("Amount is required");
  } else {
    const amount = parseFloat(String(data.amount));
    if (isNaN(amount) || amount <= 0) {
      errors.push("Amount must be a positive number");
    }
    if (amount > 100000000) {
      errors.push("Amount is unreasonably large");
    }
  }

  // Validate source
  if (!data.source) {
    errors.push("Income source is required");
  } else if (typeof data.source !== "string") {
    errors.push("Source must be a string");
  } else if (data.source.length > 100) {
    errors.push("Source name too long (max 100 characters)");
  }

  // Validate category (optional)
  if (data.category && typeof data.category === "string" && data.category.length > 50) {
    errors.push("Category name too long (max 50 characters)");
  }

  // Validate description (optional)
  if (data.description && typeof data.description === "string" && data.description.length > 500) {
    errors.push("Description too long (max 500 characters)");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      date: new Date(data.date),
      amount: parseFloat(String(data.amount)),
      source: sanitizeString(String(data.source)),
      category: data.category ? sanitizeString(String(data.category)) : "",
      description: data.description ? sanitizeString(String(data.description)) : "",
      taxable: data.taxable === true || data.taxable === "true",
      recurring: data.recurring === true || data.recurring === "true",
    },
  };
}

/**
 * Validate and sanitize contact input data
 */
export function validateContact(data: {
  name?: any;
  phone?: any;
  email?: any;
  relationship?: any;
  notes?: any;
}): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];

  // Validate name
  if (!data.name) {
    errors.push("Contact name is required");
  } else if (typeof data.name !== "string") {
    errors.push("Name must be a string");
  } else if (data.name.length < 2) {
    errors.push("Name too short (min 2 characters)");
  } else if (data.name.length > 100) {
    errors.push("Name too long (max 100 characters)");
  }

  // Validate phone (optional)
  if (data.phone && typeof data.phone === "string") {
    if (data.phone.length > 20) {
      errors.push("Phone number too long");
    }
  }

  // Validate email (optional)
  if (data.email && typeof data.email === "string") {
    if (!validator.isEmail(data.email)) {
      errors.push("Invalid email format");
    }
  }

  // Validate relationship (optional)
  if (data.relationship && typeof data.relationship === "string") {
    const validRelationships = ["friend", "family", "business", "other", ""];
    if (!validRelationships.includes(data.relationship)) {
      errors.push("Invalid relationship type");
    }
  }

  // Validate notes (optional)
  if (data.notes && typeof data.notes === "string" && data.notes.length > 1000) {
    errors.push("Notes too long (max 1000 characters)");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      name: sanitizeString(String(data.name)),
      phone: data.phone ? sanitizeString(String(data.phone)) : "",
      email: data.email ? sanitizeString(String(data.email)) : "",
      relationship: data.relationship ? sanitizeString(String(data.relationship)) : "",
      notes: data.notes ? sanitizeString(String(data.notes)) : "",
    },
  };
}

/**
 * Validate and sanitize loan input data
 */
export function validateLoan(data: {
  contactId?: any;
  contactName?: any;
  direction?: any;
  principalAmount?: any;
  interestRate?: any;
  startDate?: any;
  dueDate?: any;
  description?: any;
}): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];

  // Validate contactName (required)
  if (!data.contactName) {
    errors.push("Contact name is required");
  } else if (typeof data.contactName !== "string") {
    errors.push("Contact name must be a string");
  } else if (data.contactName.length > 100) {
    errors.push("Contact name too long (max 100 characters)");
  }

  // Validate contactId (optional)
  if (data.contactId && typeof data.contactId === "string") {
    if (!sanitizeObjectId(data.contactId)) {
      errors.push("Invalid contact ID format");
    }
  }

  // Validate direction
  if (!data.direction) {
    errors.push("Loan direction is required");
  } else {
    const validDirections = ["given", "taken"];
    if (!validDirections.includes(String(data.direction))) {
      errors.push("Direction must be 'given' or 'taken'");
    }
  }

  // Validate principal amount
  if (data.principalAmount === undefined || data.principalAmount === null) {
    errors.push("Principal amount is required");
  } else {
    const amount = parseFloat(String(data.principalAmount));
    if (isNaN(amount) || amount <= 0) {
      errors.push("Principal amount must be a positive number");
    }
    if (amount > 100000000) {
      errors.push("Principal amount is unreasonably large");
    }
  }

  // Validate interest rate (optional)
  if (data.interestRate !== undefined && data.interestRate !== null && data.interestRate !== "") {
    const rate = parseFloat(String(data.interestRate));
    if (isNaN(rate) || rate < 0 || rate > 100) {
      errors.push("Interest rate must be between 0 and 100");
    }
  }

  // Validate start date
  if (!data.startDate) {
    errors.push("Start date is required");
  } else {
    const dateStr = String(data.startDate);
    if (!validator.isISO8601(dateStr) && !validator.isDate(dateStr)) {
      errors.push("Invalid start date format");
    }
  }

  // Validate due date (optional)
  if (data.dueDate) {
    const dateStr = String(data.dueDate);
    if (!validator.isISO8601(dateStr) && !validator.isDate(dateStr)) {
      errors.push("Invalid due date format");
    }
  }

  // Validate description (optional)
  if (data.description && typeof data.description === "string" && data.description.length > 500) {
    errors.push("Description too long (max 500 characters)");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      contactId: data.contactId ? sanitizeString(String(data.contactId)) : undefined,
      contactName: sanitizeString(String(data.contactName)),
      direction: sanitizeString(String(data.direction)),
      principalAmount: parseFloat(String(data.principalAmount)),
      interestRate: data.interestRate ? parseFloat(String(data.interestRate)) : undefined,
      startDate: new Date(data.startDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      description: data.description ? sanitizeString(String(data.description)) : "",
    },
  };
}

/**
 * Validate and sanitize loan payment input data
 */
export function validateLoanPayment(data: {
  loanId?: any;
  amount?: any;
  date?: any;
  paymentMethod?: any;
  notes?: any;
}): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];

  // Validate loan ID
  if (!data.loanId) {
    errors.push("Loan ID is required");
  } else if (typeof data.loanId !== "string") {
    errors.push("Loan ID must be a string");
  } else if (!sanitizeObjectId(data.loanId)) {
    errors.push("Invalid loan ID format");
  }

  // Validate amount
  if (data.amount === undefined || data.amount === null) {
    errors.push("Payment amount is required");
  } else {
    const amount = parseFloat(String(data.amount));
    if (isNaN(amount) || amount <= 0) {
      errors.push("Payment amount must be a positive number");
    }
    if (amount > 100000000) {
      errors.push("Payment amount is unreasonably large");
    }
  }

  // Validate date
  if (!data.date) {
    errors.push("Payment date is required");
  } else {
    const dateStr = String(data.date);
    if (!validator.isISO8601(dateStr) && !validator.isDate(dateStr)) {
      errors.push("Invalid date format");
    }
  }

  // Validate payment method (optional)
  if (data.paymentMethod) {
    const validMethods = ["cash", "card", "upi", "bank_transfer", ""];
    if (!validMethods.includes(String(data.paymentMethod))) {
      errors.push("Invalid payment method");
    }
  }

  // Validate notes (optional)
  if (data.notes && typeof data.notes === "string" && data.notes.length > 500) {
    errors.push("Notes too long (max 500 characters)");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      loanId: sanitizeString(String(data.loanId)),
      amount: parseFloat(String(data.amount)),
      date: new Date(data.date),
      paymentMethod: data.paymentMethod ? sanitizeString(String(data.paymentMethod)) : "",
      notes: data.notes ? sanitizeString(String(data.notes)) : "",
    },
  };
}
