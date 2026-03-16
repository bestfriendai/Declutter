import { setGeminiApiKey, getGeminiApiKey, isApiKeyConfigured } from '../services/gemini';

describe('Gemini Service', () => {
  describe('API Key Management (server-side architecture)', () => {
    // The Gemini API key is now managed server-side in Convex env vars.
    // Client-side key management functions are deprecated no-ops.

    it('should return empty string (key is server-side only)', () => {
      expect(getGeminiApiKey()).toBe('');
    });

    it('setGeminiApiKey is a no-op — key stays empty', () => {
      setGeminiApiKey('test-api-key-123');
      expect(getGeminiApiKey()).toBe('');
    });

    it('isApiKeyConfigured always returns true (Convex action handles auth)', () => {
      expect(isApiKeyConfigured()).toBe(true);
    });

    it('isApiKeyConfigured stays true even after setGeminiApiKey no-op', () => {
      setGeminiApiKey('');
      expect(isApiKeyConfigured()).toBe(true);
    });
  });
});
