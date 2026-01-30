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
