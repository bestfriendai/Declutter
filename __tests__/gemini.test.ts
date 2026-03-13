import { setGeminiApiKey, getGeminiApiKey, isApiKeyConfigured } from '../services/gemini';

describe('Gemini Service', () => {
  describe('API Key Management', () => {
    beforeEach(() => {
      setGeminiApiKey('');
    });

    it('should return empty string when no key is set', () => {
      expect(getGeminiApiKey()).toBe('');
    });

    it('should store and retrieve API key', () => {
      const testKey = 'test-api-key-123';
      setGeminiApiKey(testKey);
      expect(getGeminiApiKey()).toBe(testKey);
    });

    it('should report API key not configured when empty', () => {
      expect(isApiKeyConfigured()).toBe(false);
    });

    it('should report API key configured when set', () => {
      setGeminiApiKey('valid-key');
      expect(isApiKeyConfigured()).toBe(true);
    });
  });
});
