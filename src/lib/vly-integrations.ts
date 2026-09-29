// LLM provider configuration
//
// Two providers are supported, tried in this order:
//
// 1. YOUR OWN OpenAI-compatible endpoint — set these env vars (Convex env store):
//      OPENAI_API_KEY     required  (OpenAI / Groq / OpenRouter / any compatible)
//      OPENAI_BASE_URL    optional  (default: https://api.openai.com/v1)
//      OPENAI_MODEL       optional  (default: gpt-4o-mini) — used when the
//                                   requested model is a gateway-specific name
//
// 2. VLY gateway — set VLY_INTEGRATION_KEY. Note: this gateway only works
//    from the Freebuff hosted environment; from a local machine it returns
//    401 "Invalid token", which is why option 1 exists.
//
// Set keys via: npx convex env set OPENAI_API_KEY sk-...
//
// The exported `vly` object keeps the same `vly.ai.completion(...)` shape as
// @vly-ai/integrations, so call sites (convex/agent.ts) need no changes.

type ChatMessage = { role: string; content: string };

type CompletionRequest = {
  model?: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
};

type CompletionResponse = {
  id: string;
  choices: Array<{ message: { role: string; content: string }; finishReason: string }>;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

async function openAICompatibleCompletion(
  request: CompletionRequest,
): Promise<ApiResponse<CompletionResponse> | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null; // no custom key configured → let caller fall back

  const baseUrl = (process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  // Gateway-specific model names (e.g. "openai/gpt-oss-safeguard-20b") don't
  // exist on the custom provider — map them to the configured default model.
  const requested = request.model ?? DEFAULT_MODEL;
  const model = process.env.OPENAI_MODEL ?? (requested.includes('/') ? DEFAULT_MODEL : requested);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
    });

    const body: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (body as { error?: { message?: string } | string } | null)?.error ?
          typeof (body as { error: { message?: string } | string }).error === 'string'
            ? (body as { error: string }).error
            : (body as { error: { message?: string } }).error.message
        : `LLM request failed (HTTP ${res.status})`;
      return { success: false, error: message };
    }

    const data = body as {
      id?: string;
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    return {
      success: true,
      data: {
        id: data.id ?? 'custom',
        choices: (data.choices ?? []).map((c) => ({
          message: { role: 'assistant', content: c.message?.content ?? '' },
          finishReason: c.finish_reason ?? 'stop',
        })),
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'LLM request failed',
    };
  }
}

export const vly = {
  ai: {
    async completion(request: CompletionRequest): Promise<ApiResponse<CompletionResponse>> {
      // 1) Custom OpenAI-compatible provider (own key) — preferred.
      const custom = await openAICompatibleCompletion(request);
      if (custom) return custom;

      // 2) Fallback: vly gateway (works on the Freebuff hosted environment).
      const { createVlyIntegrations } = await import('@vly-ai/integrations');
      const gateway = createVlyIntegrations({
        deploymentToken: process.env.VLY_INTEGRATION_KEY ?? '',
        debug: process.env.NODE_ENV === 'development',
      });
      return gateway.ai.completion(request) as unknown as Promise<ApiResponse<CompletionResponse>>;
    },
  },
};

export type { ChatMessage };