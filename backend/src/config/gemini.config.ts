import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { AppConfigService } from './app.config';
import { LlmMetaSchema, LlmMeta } from '@/shared/contracts';
import { hashString, hashJson } from '@/shared/utils';

export interface GenerateJsonOptions {
  grounded?: boolean;
  model?: string;
  temperature?: number;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(private config: AppConfigService) {
  const apiKey = process.env.GEMINI_API_KEY || this.config?.geminiApiKey;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

  this.client = new GoogleGenerativeAI(apiKey);

  this.model =
    process.env.GEMINI_MODEL || this.config?.geminiModel || 'gemini-1.5-pro';
}


  async generateJson<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    opts?: GenerateJsonOptions
  ): Promise<{ data: T; meta: LlmMeta }> {
    const startTime = Date.now();
    const promptHash = hashString(prompt);
    let retryCount = 0;
    let lastError: Error | null = null;

    const model = opts?.model || this.model;
    const systemPrompt = this.buildSystemPrompt(schema, opts?.grounded);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        retryCount++;
        this.logger.debug(`Gemini generation attempt ${attempt + 1}`, {
          model,
          promptHash,
        });

        const generationConfig = {
          temperature: opts?.temperature ?? 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        };

        const modelInstance = this.client.getGenerativeModel({
          model,
        });

        const result = await modelInstance.generateContent({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] },
          ],
          generationConfig,
        });

        const responseText = result.response.text();
        if (!responseText) {
          throw new Error('Empty response from Gemini');
        }

        let jsonData: any;
        try {
          jsonData = JSON.parse(responseText);
        } catch (e) {
          // Attempt JSON repair
          const repaired = this.repairJson(responseText);
          jsonData = JSON.parse(repaired);
        }

        // Validate against schema
        const validated = schema.parse(jsonData);

        const latencyMs = Date.now() - startTime;
        const responseHash = hashJson(jsonData);

        const meta: LlmMeta = {
          modelName: model,
          promptHash,
          responseHash,
          latencyMs,
          retryCount: attempt,
        };

        this.logger.debug('Gemini generation succeeded', { meta });
        return { data: validated, meta };
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Gemini generation attempt ${attempt + 1} failed:`, {
          error: lastError.message,
          attempt,
        });

        if (attempt < 2) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    this.logger.error('All Gemini generation attempts failed', {
      promptHash,
      error: lastError?.message,
    });
    throw lastError || new Error('Failed to generate JSON from Gemini');
  }

  private buildSystemPrompt(
    schema: z.ZodSchema,
    grounded?: boolean
  ): string {
    let prompt = `You are a JSON generation assistant. You must respond ONLY with valid JSON that matches the provided schema. Do not include any markdown formatting, code blocks, or explanations.

Schema to follow:
${JSON.stringify(schema, null, 2)}

Requirements:
1. Return ONLY valid JSON
2. Do not wrap in code blocks or markdown
3. Ensure all fields match the schema exactly
4. Use exact enum values if specified
5. Do not add extra fields`;

    if (grounded) {
      prompt += `\n6. Include citations and sources for factual claims when possible`;
    }

    return prompt;
  }

  private repairJson(text: string): string {
    // Remove markdown code block markers
    let repaired = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');

    // Remove any leading/trailing whitespace and markdown
    repaired = repaired
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    // If it starts with ```json, remove it
    if (repaired.startsWith('```json')) {
      repaired = repaired.substring(7).trim();
    }

    // If it ends with ```, remove it
    if (repaired.endsWith('```')) {
      repaired = repaired.substring(0, repaired.length - 3).trim();
    }

    return repaired;
  }
}
