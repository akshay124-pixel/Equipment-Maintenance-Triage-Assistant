import prisma from '../db';
import { createAIProvider } from '../ai/provider-factory';

export interface ProcessedDocument {
  documentId: string;
  chunksCreated: number;
  success: boolean;
  error?: string;
}

export class DocumentProcessor {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor() {
    this.chunkSize = parseInt(process.env.CHUNK_SIZE || '1000');
    this.chunkOverlap = parseInt(process.env.CHUNK_OVERLAP || '200');
  }

  /**
   * Process uploaded document: extract text, chunk, generate embeddings
   */
  async processDocument(documentId: string, fileBuffer: Buffer, mimeType: string): Promise<ProcessedDocument> {
    try {
      // Update status to processing
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { processingStatus: 'processing' },
      });

      // Extract text based on mime type
      const text = await this.extractText(fileBuffer, mimeType);

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from document');
      }

      // Chunk the text
      const chunks = this.chunkText(text);

      if (chunks.length === 0) {
        throw new Error('No chunks created from document');
      }

      // Generate embeddings and store chunks
      const aiProvider = createAIProvider();
      let chunksCreated = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const embedding = await aiProvider.generateEmbedding(chunk.content);
          
          await prisma.$executeRaw`
            INSERT INTO "KnowledgeChunk" (id, "documentId", content, "chunkIndex", section, page, embedding, "createdAt")
            VALUES (gen_random_uuid(), ${documentId}, ${chunk.content}, ${i}, ${chunk.section}, ${chunk.page}, ${embedding}::vector, NOW())
          `;
          
          chunksCreated++;
        } catch (error) {
          console.error(`Failed to process chunk ${i}:`, error);
          // Continue processing other chunks
        }
      }

      if (chunksCreated === 0) {
        throw new Error('Failed to create any chunks with embeddings');
      }

      // Mark as completed
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: {
          processingStatus: 'completed',
          processedAt: new Date(),
        },
      });

      return {
        documentId,
        chunksCreated,
        success: true,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Mark as failed
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: {
          processingStatus: 'failed',
          processingError: errorMessage,
        },
      });

      return {
        documentId,
        chunksCreated: 0,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Extract text from file buffer based on mime type
   */
  private async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'text/plain') {
      return buffer.toString('utf-8');
    }

    if (mimeType === 'application/pdf') {
      // For PDF extraction, we would use pdf-parse here
      // Simplified implementation - in production use pdf-parse npm package
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text;
      } catch (error) {
        throw new Error('PDF parsing failed. Ensure pdf-parse is installed.');
      }
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  /**
   * Chunk text into overlapping segments
   */
  private chunkText(text: string): Array<{ content: string; section?: string; page?: number }> {
    const chunks: Array<{ content: string; section?: string; page?: number }> = [];
    
    // Simple sentence-aware chunking
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;

      if (currentLength + sentenceLength > this.chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          content: currentChunk.trim(),
        });

        // Start new chunk with overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(this.chunkOverlap / 5)); // Approximate word overlap
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
        currentLength = currentChunk.length;
      } else {
        currentChunk += ' ' + sentence;
        currentLength += sentenceLength;
      }
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
      });
    }

    return chunks;
  }

  /**
   * Delete document and all its chunks
   */
  async deleteDocument(documentId: string): Promise<void> {
    await prisma.knowledgeDocument.delete({
      where: { id: documentId },
    });
  }
}

export const documentProcessor = new DocumentProcessor();
