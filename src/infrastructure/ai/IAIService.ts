export interface AICompletionRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface IAIService {
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  generateEmbedding(text: string): Promise<number[]>;
}
