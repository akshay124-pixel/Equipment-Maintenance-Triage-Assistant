import prisma from '../db';
import { createAIProvider } from '../ai/provider-factory';
import { RetrievedChunk } from '../ai/types';

export interface RetrievalOptions {
  equipmentType?: string;
  maxChunks?: number;
  minScore?: number;
}

export class RAGRetrieval {
  private retrievalThreshold: number;
  private maxChunksPerQuery: number;

  constructor() {
    this.retrievalThreshold = parseFloat(process.env.RETRIEVAL_THRESHOLD || '0.7');
    this.maxChunksPerQuery = parseInt(process.env.MAX_CHUNKS_PER_QUERY || '5');
  }

  /**
   * Retrieve relevant knowledge chunks using semantic search
   */
  async retrieveRelevantChunks(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievedChunk[]> {
    try {
      const maxChunks = options.maxChunks || this.maxChunksPerQuery;
      const minScore = options.minScore || this.retrievalThreshold;

      // Generate embedding for query
      const aiProvider = createAIProvider();
      const queryEmbedding = await aiProvider.generateEmbedding(query);

      // Build the SQL query
      let whereClause = '';
      const params: any[] = [queryEmbedding, maxChunks];

      if (options.equipmentType) {
        whereClause = 'WHERE d."equipmentType" = $3';
        params.push(options.equipmentType);
      }

      // Perform vector similarity search
      const results: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          c.id,
          c.content,
          c.section,
          c.page,
          c."chunkIndex",
          d.id as "documentId",
          d.title as "documentTitle",
          1 - (c.embedding <=> $1::vector) as similarity
        FROM "KnowledgeChunk" c
        JOIN "KnowledgeDocument" d ON c."documentId" = d.id
        ${whereClause}
        WHERE d."processingStatus" = 'completed'
        ORDER BY c.embedding <=> $1::vector
        LIMIT $2
      `, ...params);

      // Filter by minimum score and transform to RetrievedChunk[]
      const chunks: RetrievedChunk[] = results
        .filter(r => r.similarity >= minScore)
        .map(r => ({
          content: r.content,
          documentTitle: r.documentTitle,
          section: r.section || undefined,
          page: r.page || undefined,
          relevanceScore: r.similarity,
          chunkId: r.id,
          documentId: r.documentId,
        }));

      return chunks;

    } catch (error) {
      console.error('RAG retrieval failed:', error);
      // Return empty array on failure - don't crash the triage process
      return [];
    }
  }

  /**
   * Build retrieval query from equipment issue context
   */
  buildRetrievalQuery(
    equipmentType: string,
    issueDescription: string,
    operatingEvents: string[]
  ): string {
    const parts = [
      `Equipment: ${equipmentType}`,
      `Issue: ${issueDescription}`,
    ];

    if (operatingEvents.length > 0) {
      parts.push(`Events: ${operatingEvents.join(', ')}`);
    }

    return parts.join('. ');
  }

  /**
   * Check if retrieval service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if pgvector extension is available
      const result = await prisma.$queryRaw`
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      `;
      
      return Array.isArray(result) && result.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get retrieval statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    processingDocuments: number;
    failedDocuments: number;
  }> {
    const [totalDocuments, totalChunks, processingDocuments, failedDocuments] = await Promise.all([
      prisma.knowledgeDocument.count(),
      prisma.knowledgeChunk.count(),
      prisma.knowledgeDocument.count({ where: { processingStatus: 'processing' } }),
      prisma.knowledgeDocument.count({ where: { processingStatus: 'failed' } }),
    ]);

    return {
      totalDocuments,
      totalChunks,
      processingDocuments,
      failedDocuments,
    };
  }
}

export const ragRetrieval = new RAGRetrieval();
