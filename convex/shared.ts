/**
 * Shared utility functions for Convex backend.
 */

/**
 * Sanitize user-generated text input:
 * - Strip HTML tags
 * - Trim whitespace
 * - Enforce max length
 */
export function sanitizeInput(text: string, maxLength: number = 200): string {
  return text
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/&[a-zA-Z]+;/g, "") // strip HTML entities
    .trim()
    .slice(0, maxLength);
}
