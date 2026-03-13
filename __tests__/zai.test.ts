import {
  setZaiApiKey,
  getZaiApiKey,
  isZaiApiKeyConfigured,
  setZaiFreeTier,
  isUsingFreeTier,
  setZaiCodingPlan,
  isUsingCodingPlan,
} from '../services/zai';

describe('Z.AI Service', () => {
  describe('API Key Management', () => {
    beforeEach(() => {
      setZaiApiKey('');
    });

    it('should return empty string when no key is set', () => {
      expect(getZaiApiKey()).toBe('');
    });

    it('should store and retrieve API key', () => {
      const testKey = 'zai-test-api-key-123';
      setZaiApiKey(testKey);
      expect(getZaiApiKey()).toBe(testKey);
    });

    it('should report API key not configured when empty', () => {
      expect(isZaiApiKeyConfigured()).toBe(false);
    });

    it('should report API key configured when set', () => {
      setZaiApiKey('valid-zai-key');
      expect(isZaiApiKeyConfigured()).toBe(true);
    });
  });

  describe('Free Tier Configuration', () => {
    beforeEach(() => {
      setZaiFreeTier(false);
    });

    it('should default to paid tier (free tier disabled)', () => {
      expect(isUsingFreeTier()).toBe(false);
    });

    it('should enable free tier when set to true', () => {
      setZaiFreeTier(true);
      expect(isUsingFreeTier()).toBe(true);
    });

    it('should disable free tier when set to false', () => {
      setZaiFreeTier(true);
      expect(isUsingFreeTier()).toBe(true);
      setZaiFreeTier(false);
      expect(isUsingFreeTier()).toBe(false);
    });
  });

  describe('Coding Plan Configuration', () => {
    beforeEach(() => {
      setZaiCodingPlan(false);
    });

    it('should default to standard endpoint (coding plan disabled)', () => {
      expect(isUsingCodingPlan()).toBe(false);
    });

    it('should enable coding plan when set to true', () => {
      setZaiCodingPlan(true);
      expect(isUsingCodingPlan()).toBe(true);
    });

    it('should disable coding plan when set to false', () => {
      setZaiCodingPlan(true);
      expect(isUsingCodingPlan()).toBe(true);
      setZaiCodingPlan(false);
      expect(isUsingCodingPlan()).toBe(false);
    });
  });
});
