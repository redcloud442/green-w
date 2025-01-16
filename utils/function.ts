import crypto from "crypto";
import { LRUCache } from "lru-cache";
import { RegisterFormData } from "./types";

// export const hashData = async (data: string) => {
//   const saltRounds = 10;
//   const hashedPassword = await bcrypt.hash(data, saltRounds);

//   return hashedPassword;
// };

export const decryptData = async (encryptedData: string, ivHex: string) => {
  const key = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY;

  if (!key) {
    throw new Error("CRYPTO_SECRET_KEY is not defined");
  }

  if (key.length !== 64) {
    throw new Error(
      "CRYPTO_SECRET_KEY must be a 32-byte (64 characters) hex string"
    );
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    Buffer.from(ivHex, "hex")
  );

  let decrypted = decipher.update(encryptedData, "hex", "utf-8");
  decrypted += decipher.final("utf-8");

  return decrypted;
};

export const hashData = async (data: string) => {
  const iv = crypto.randomBytes(16);

  const allowedKey = process.env.ALLOWED_CRYPTO_KEY;

  if (!allowedKey) {
    throw new Error("ALLOWED_CRYPTO_KEY is not defined");
  }

  // Ensure only the allowed key is accepted
  if (!allowedKey) {
    throw new Error("The provided key does not match the allowed key");
  }
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(allowedKey, "hex"),
    iv
  );

  let encrypted = cipher.update(data, "utf-8", "hex");
  encrypted += cipher.final("hex");

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
  };
};

export const sanitizeData = (data: RegisterFormData) => {
  const unescapeHtml = (input: string): string => {
    const textArea = document.createElement("textarea");
    textArea.innerHTML = input;
    return textArea.value;
  };

  const sanitizeString = (input: string): string => {
    const unescaped = unescapeHtml(input);
    return unescaped.replace(/<script.*?>.*?<\/script>/gi, "").trim();
  };

  return {
    email: sanitizeString(data.email),
    password: sanitizeString(data.password),
    confirmPassword: sanitizeString(data.confirmPassword),
  };
};

// Utility function to escape special characters in strings
export const escapeString = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const escapeFormData = <T>(data: T): T => {
  const escapeString = (str: string): string => {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
  };

  if (typeof data === "string") {
    return escapeString(data) as T;
  } else if (data instanceof Date) {
    // Handle Date objects by converting them to ISO strings
    return data.toISOString() as unknown as T;
  } else if (Array.isArray(data)) {
    return data.map((item) => escapeFormData(item)) as unknown as T;
  } else if (data instanceof File) {
    // Handle file objects
    const escapedFile = new File(
      [data],
      escapeString(data.name), // Escape the file name
      { type: data.type }
    );
    return escapedFile as unknown as T;
  } else if (typeof data === "object" && data !== null) {
    return Object.keys(data).reduce((acc, key) => {
      acc[key as keyof T] = escapeFormData(data[key as keyof T]);
      return acc;
    }, {} as T);
  }
  return data;
};

const rateLimiter = new LRUCache({
  max: 1000,
  ttl: 60 * 1000, // 1 minute time-to-live
});

export const applyRateLimit = async (
  teamMemberId: string,
  ipAddress: string
) => {
  if (!teamMemberId) {
    throw new Error("teamMemberId is required for rate limiting.");
  }

  if (!ipAddress) {
    throw new Error("IP address is required for rate limiting.");
  }

  const rateLimitKey = `${teamMemberId}-${ipAddress}`;

  const currentCount = (rateLimiter.get(rateLimitKey) as number) || 0;

  if (currentCount >= 50) {
    throw new Error("Too many requests. Please try again later.");
  }

  rateLimiter.set(rateLimitKey, currentCount + 1);
};

export const applyRateLimitMember = async (teamMemberId: string) => {
  if (!teamMemberId) {
    throw new Error("teamMemberId is required for rate limiting.");
  }

  const rateLimitKey = `${teamMemberId}`;

  const currentCount = (rateLimiter.get(rateLimitKey) as number) || 0;

  if (currentCount >= 50) {
    throw new Error("Too many requests. Please try again later.");
  }

  rateLimiter.set(rateLimitKey, currentCount + 1);
};

export const loginRateLimit = (ip: string, userName?: string) => {
  const currentCount = (rateLimiter.get(ip) as number) || 0;

  if (currentCount >= 5) {
    throw new Error("Too many requests. Please try again later.");
  }

  if (userName) {
    const userNameCount = (rateLimiter.get(userName) as number) || 0;
    if (userNameCount >= 5) {
      throw new Error("Too many requests. Please try again later.");
    }
  }

  rateLimiter.set(ip, currentCount + 1);
};

export const formatDateToYYYYMMDD = (date: Date | string): string => {
  const inputDate = typeof date === "string" ? new Date(date) : date;

  if (isNaN(inputDate.getTime())) {
    return "Invalid date"; // Handle invalid dates gracefully
  }

  const year = String(inputDate.getFullYear()); // Full year
  const month = String(inputDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(inputDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const formateMonthDateYear = (date: Date | string): string => {
  const inputDate = typeof date === "string" ? new Date(date) : date;

  if (isNaN(inputDate.getTime())) {
    return "Invalid date"; // Handle invalid dates gracefully
  }

  const year = String(inputDate.getFullYear()); // Full year
  const month = String(inputDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(inputDate.getDate()).padStart(2, "0");

  return `${month}/${day}/${year}`;
};

export const formatMonthDateYear = (date: Date | string): string => {
  const inputDate = typeof date === "string" ? new Date(date) : date;

  if (isNaN(inputDate.getTime())) {
    return "Invalid date"; // Handle invalid dates gracefully
  }

  const year = inputDate.getFullYear(); // Full year
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]; // Month names
  const month = months[inputDate.getMonth()]; // Get abbreviated month name
  const day = String(inputDate.getDate()).padStart(2, "0"); // Day of the month with leading zero

  return `${month}-${day}-${year}`;
};

export const formatTime = (date: Date | string): string => {
  const inputDate = typeof date === "string" ? new Date(date) : date;

  if (isNaN(inputDate.getTime())) {
    return "Invalid date"; // Handle invalid dates gracefully
  }

  let hours = inputDate.getHours(); // Get hours (0-23)
  const minutes = String(inputDate.getMinutes()).padStart(2, "0"); // Get minutes with leading zero
  const ampm = hours >= 12 ? "PM" : "AM"; // Determine AM or PM

  hours = hours % 12 || 12; // Convert 24-hour format to 12-hour format (0 becomes 12)

  return `${hours}:${minutes} ${ampm}`;
};

export const calculateFinalAmount = (
  amount: number,
  selectedEarnings: string
): number => {
  if (selectedEarnings === "TOTAL") {
    const fee = amount * 0.1;
    return amount - fee;
  } else if (
    ["DIRECT REFERRAL", "INDIRECT REFERRAL"].includes(selectedEarnings)
  ) {
    const fee = amount * 0.1;
    return amount - fee;
  }
  return amount;
};

export const calculateFee = (
  amount: number,
  selectedEarnings: string
): number => {
  if (selectedEarnings === "TOTAL") {
    const fee = amount * 0.1;
    return fee;
  } else if (
    ["DIRECT REFERRAL", "INDIRECT REFERRAL"].includes(selectedEarnings)
  ) {
    const fee = amount * 0.1;
    return fee;
  }
  return 0;
};

export const userNameToEmail = (userName: string) => {
  return `${userName}@gmail.com`;
};
