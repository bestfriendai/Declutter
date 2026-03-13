import { AIAnalysisResult } from '@/types/declutter';
import { api } from '@/convex/_generated/api';
import { convex } from '@/config/convex';
import {
  setGeminiApiKey,
  getGeminiApiKey,
} from './gemini';
import {
  analyzeRoomImageWithZai,
  analyzeProgressWithZai,
  getMotivationWithZai,
  isZaiApiKeyConfigured,
  setZaiApiKey,
  getZaiApiKey,
  setZaiFreeTier,
  setZaiCodingPlan,
  detectObjectsInRoom,
} from './zai';

export type AIProvider = 'gemini' | 'zai';

const ENV_PROVIDER = (process.env.EXPO_PUBLIC_AI_PROVIDER as AIProvider) || 'gemini';
const ENV_ZAI_FREE = process.env.EXPO_PUBLIC_ZAI_FREE_TIER === 'true';
const ENV_ZAI_CODING_PLAN = process.env.EXPO_PUBLIC_ZAI_CODING_PLAN === 'true';

let currentProvider: AIProvider = ENV_PROVIDER;

export function setAIProvider(provider: AIProvider) {
  currentProvider = provider;
}

export function getAIProvider(): AIProvider {
  return currentProvider;
}

export function isCurrentProviderConfigured(): boolean {
  if (currentProvider === 'zai') {
    return isZaiApiKeyConfigured();
  }
  return true;
}

export function setApiKey(key: string, provider?: AIProvider) {
  const target = provider || currentProvider;
  if (target === 'zai') {
    setZaiApiKey(key);
  } else {
    setGeminiApiKey(key);
  }
}

export function getApiKey(provider?: AIProvider): string {
  const target = provider || currentProvider;
  if (target === 'zai') {
    return getZaiApiKey();
  }
  return getGeminiApiKey();
}

export function setFreeTier(enabled: boolean) {
  setZaiFreeTier(enabled);
}

export function setCodingPlan(enabled: boolean) {
  setZaiCodingPlan(enabled);
}

export async function analyzeRoomImage(
  base64Image: string,
  additionalContext?: string
): Promise<AIAnalysisResult> {
  if (currentProvider === 'zai') {
    setZaiFreeTier(ENV_ZAI_FREE);
    setZaiCodingPlan(ENV_ZAI_CODING_PLAN);
    return analyzeRoomImageWithZai(base64Image, additionalContext);
  }
  return convex.action(api.gemini.analyzeRoom, {
    base64Image,
    additionalContext,
  });
}

export async function analyzeProgress(
  beforeImage: string,
  afterImage: string
): Promise<{
  progressPercentage: number;
  completedTasks: string[];
  remainingTasks: string[];
  encouragement: string;
}> {
  if (currentProvider === 'zai') {
    setZaiFreeTier(ENV_ZAI_FREE);
    setZaiCodingPlan(ENV_ZAI_CODING_PLAN);
    return analyzeProgressWithZai(beforeImage, afterImage);
  }
  return convex.action(api.gemini.analyzeProgress, {
    beforeImage,
    afterImage,
  });
}

export async function getMotivation(context: string): Promise<string> {
  if (currentProvider === 'zai') {
    setZaiFreeTier(ENV_ZAI_FREE);
    setZaiCodingPlan(ENV_ZAI_CODING_PLAN);
    return getMotivationWithZai(context);
  }
  return convex.action(api.gemini.getMotivation, {
    context,
  });
}

export { detectObjectsInRoom };

export function getProviderInfo(provider?: AIProvider): {
  name: string;
  model: string;
  features: string[];
} {
  const target = provider || currentProvider;
  
  if (target === 'zai') {
    return {
      name: 'Z.AI',
      model: ENV_ZAI_FREE ? 'GLM-4.6V-Flash (Free)' : 'GLM-4.6V',
      features: [
        'Object detection with bounding boxes',
        'Thinking mode for reasoning',
        '128K context window',
        'Native multimodal tool calling',
      ],
    };
  }
  
  return {
    name: 'Google',
    model: 'Gemini 2.5 Flash',
    features: [
      'Fast multimodal analysis',
      'ADHD-friendly task breakdown',
      'Progress comparison',
    ],
  };
}
