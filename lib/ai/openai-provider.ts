import { AIProvider, TriageInput, TriageResult } from './types';
import { z } from 'zod';

const TriageResultSchema = z.object({
  observations: z.array(z.string()),
  possibleCauses: z.array(z.string()),
  confirmedFindings: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  inspectionSteps: z.array(
    z.object({
      step: z.string(),
      evidenceSource: z.string().optional(),
    })
  ),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  reasoningSummary: z.string(),
  evidence: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      sourceType: z.enum(['MANUAL', 'SENSOR', 'EVENT', 'HISTORY']),
      sourceId: z.string().optional(),
      section: z.string().optional(),
      page: z.number().optional(),
    })
  ),
});

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private apiBase: string;
  private model: string;
  private embeddingModel: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    
    try {
      const response = await fetch(`${this.apiBase}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateTriageAnalysis(input: TriageInput): Promise<TriageResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    const response = await fetch(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    const parsed = JSON.parse(content);
    const validated = TriageResultSchema.parse(parsed);

    return validated;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.apiBase}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI Embedding API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  private buildSystemPrompt(): string {
    return `You are a maintenance triage assistant for industrial equipment. Your role is advisory only.

CRITICAL RULES:
1. You must distinguish observations from hypotheses
2. NEVER claim a possible cause is confirmed without explicit technician confirmation
3. Use ONLY provided evidence - do not invent sensor readings or manual information
4. If evidence is insufficient, explicitly state that
5. If data conflicts, identify the conflict clearly
6. If knowledge retrieval failed, state that explicitly
7. Provide targeted, specific questions
8. Ground inspection suggestions in the retrieved manual content
9. Maintenance priority must be explainable with evidence
10. You are advisory only - never approve or execute maintenance work

OUTPUT FORMAT:
You must return valid JSON matching this exact schema:
{
  "observations": ["string"] - directly measured or reported facts only,
  "possibleCauses": ["string"] - unconfirmed hypotheses only,
  "confirmedFindings": ["string"] - only technician-confirmed items,
  "followUpQuestions": ["string"] - specific, actionable questions,
  "inspectionSteps": [{"step": "string", "evidenceSource": "string"}],
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "reasoningSummary": "string" - explain priority and recommendations,
  "evidence": [{"type": "string", "description": "string", "sourceType": "MANUAL"|"SENSOR"|"EVENT"|"HISTORY", "sourceId": "string", "section": "string", "page": number}]
}

When sensor data is MISSING, explicitly acknowledge it in observations.
When sensor data is CONFLICTING, explicitly state the conflict in observations.
When no relevant manual sections are found, state that in reasoningSummary.`;
  }

  private buildUserPrompt(input: TriageInput): string {
    let prompt = `EQUIPMENT INFORMATION:
Type: ${input.equipmentType}
Identifier: ${input.equipmentIdentifier}

REPORTED ISSUE:
${input.issueDescription}

OPERATING EVENTS:
${input.operatingEvents.join('\n')}

SENSOR THRESHOLD ANALYSIS:
${this.formatSensorResults(input.sensorResults)}

RETRIEVED MANUAL SECTIONS:
${this.formatRetrievedContext(input.retrievedContext)}
`;

    if (input.maintenanceHistory && input.maintenanceHistory.length > 0) {
      prompt += `\nRECENT MAINTENANCE HISTORY:
${input.maintenanceHistory.join('\n')}
`;
    }

    prompt += `\nProvide your triage analysis following the required JSON schema.`;

    return prompt;
  }

  private formatSensorResults(results: TriageInput['sensorResults']): string {
    if (results.length === 0) {
      return 'No sensor data provided.';
    }

    return results
      .map((r) => {
        const statusIndicator = this.getStatusIndicator(r.status);
        const valueStr = r.value !== null ? `${r.value} ${r.unit}` : 'MISSING';
        
        let line = `${statusIndicator} ${r.sensor}: ${valueStr}`;
        
        if (r.threshold !== undefined && r.value !== null) {
          line += ` (threshold: ${r.operator} ${r.threshold} ${r.unit})`;
        }
        
        if (r.status !== 'NORMAL' && r.message) {
          line += ` - ${r.message}`;
        }
        
        return line;
      })
      .join('\n');
  }

  private getStatusIndicator(status: string): string {
    switch (status) {
      case 'NORMAL':
        return '✓';
      case 'WARNING':
        return '⚠';
      case 'EXCEEDED':
        return '✗';
      case 'CONFLICTING':
        return '⚡';
      case 'MISSING':
        return '?';
      default:
        return '•';
    }
  }

  private formatRetrievedContext(chunks: TriageInput['retrievedContext']): string {
    if (chunks.length === 0) {
      return 'No relevant manual sections found. Recommendations must not reference specific manual content.';
    }

    return chunks
      .map((chunk, index) => {
        let section = `[${index + 1}] ${chunk.documentTitle}`;
        if (chunk.section) section += ` - ${chunk.section}`;
        if (chunk.page) section += ` (Page ${chunk.page})`;
        section += `\nRelevance: ${(chunk.relevanceScore * 100).toFixed(1)}%`;
        section += `\n${chunk.content}\n`;
        return section;
      })
      .join('\n---\n\n');
  }
}
