import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

/**
 * Checks if an error indicates the database is in recovery mode or unavailable
 */
export function isDatabaseRecoveryError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();
  
  return (
    lowerMessage.includes("recovery mode") ||
    lowerMessage.includes("not yet accepting connections") ||
    lowerMessage.includes("consistent recovery state") ||
    lowerMessage.includes("database system is in") ||
    lowerMessage.includes("connection refused") ||
    lowerMessage.includes("connection timeout") ||
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("etimedout")
  );
}

/**
 * Checks if an error is a transient database error that might be retryable
 */
export function isRetryableDatabaseError(error: unknown): boolean {
  if (isDatabaseRecoveryError(error)) return true;
  
  if (error instanceof PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1002: Database server timed out
    // P1008: Operations timed out
    // P1017: Server has closed the connection
    const retryableCodes = ["P1001", "P1002", "P1008", "P1017"];
    return retryableCodes.includes(error.code);
  }
  
  return false;
}

/**
 * Retries a database operation with exponential backoff
 * @param operation The async operation to retry
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param initialDelayMs Initial delay in milliseconds (default: 500)
 * @returns The result of the operation
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 500,
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's not a retryable error
      if (!isRetryableDatabaseError(error)) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff (with jitter)
      const delay = initialDelayMs * Math.pow(2, attempt) + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      console.warn(
        `Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  
  // If we get here, all retries failed
  if (isDatabaseRecoveryError(lastError)) {
    const recoveryError = new Error(
      "Database is currently unavailable. The database server is in recovery mode and cannot accept connections. " +
      "Please wait a few moments and try again. If this issue persists, contact your system administrator.",
    );
    recoveryError.cause = lastError;
    throw recoveryError;
  }
  
  throw lastError;
}

/**
 * Gets a user-friendly error message for database errors
 */
export function getDatabaseErrorMessage(error: unknown): string {
  if (isDatabaseRecoveryError(error)) {
    return "Database is temporarily unavailable. Please try again in a few moments.";
  }
  
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P1001":
        return "Cannot reach the database server. Please check your connection.";
      case "P1002":
        return "Database connection timed out. Please try again.";
      case "P1008":
        return "Database operation timed out. Please try again.";
      case "P1017":
        return "Database connection was closed. Please try again.";
      default:
        return error.message || "A database error occurred.";
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected database error occurred.";
}

