const COLLAPSED_WHITESPACE = /\s+/g;
const UNSAFE_PROMPT_CHARS = /[<>{}]/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export function sanitizeAiContext(
  value: string | undefined,
  maxLength = 200
): string | undefined {
  if (!value) {
    return undefined;
  }

  const sanitized = value
    .replace(CONTROL_CHARS, ' ')
    .replace(UNSAFE_PROMPT_CHARS, '')
    .replace(COLLAPSED_WHITESPACE, ' ')
    .trim()
    .slice(0, maxLength);

  return sanitized.length > 0 ? sanitized : undefined;
}
