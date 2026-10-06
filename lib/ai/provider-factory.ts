import { AIProvider } from './types';
import { OpenAIProvider } from './openai-provider';
import { OllamaProvider } from './ollama-provider';
import { GeminiProvider } from './gemini-provider';

export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'gemini';

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider();
    case 'ollama':
      return new OllamaProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export async function getAvailableProvider(): Promise<AIProvider | null> {
  const providers: AIProvider[] = [
    new GeminiProvider(),
    new OpenAIProvider(),
    new OllamaProvider(),
  ];

  for (const provider of providers) {
    if (await provider.isAvailable()) {
      return provider;
    }
  }

  return null;
}
