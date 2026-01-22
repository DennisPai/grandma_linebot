import { RetrievalService } from './retrievalService.js';
import type { RetrievalOptions } from '../types/index.js';
import { prisma } from '../config/database.config.js';

export class RAGService {
  /**
   * 檢索相關知識文檔
   */
  static async retrieveRelevant(
    userMessage: string,
    userInterests: string[] = [],
    options: RetrievalOptions = { topK: 3 }
  ) {
    try {
      // 1. 從向量庫檢索
      const results = await RetrievalService.retrieveRelevant(
        userMessage,
        userInterests,
        options
      );

      if (results.length === 0) {
        return [];
      }

      // 2. 從資料庫載入完整文檔資訊
      const documentIds = results.map((r: { id: string }) => parseInt(r.id)).filter((id: number) => !isNaN(id));

      const documents = await prisma.document.findMany({
        where: {
          id: { in: documentIds }
        }
      });

      // 3. 更新引用次數
      if (documentIds.length > 0) {
        await prisma.document.updateMany({
          where: {
            id: { in: documentIds }
          },
          data: {
            referenceCount: { increment: 1 },
            lastUsedAt: new Date()
          }
        });
      }

      return documents;
    } catch (error) {
      console.error('Error in RAG retrieval:', error);
      return [];
    }
  }

  /**
   * 新增文檔到知識庫
   */
  static async addDocument(documentId: number) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.isIndexed) {
      console.log(`Document ${documentId} already indexed`);
      return;
    }

    // 新增到向量庫
    await RetrievalService.addDocument(
      documentId.toString(),
      document.content,
      {
        title: document.title,
        category: document.category,
        tags: document.tags.join(',')
      }
    );

    // 更新索引狀態
    await prisma.document.update({
      where: { id: documentId },
      data: {
        isIndexed: true,
        chromaId: documentId.toString()
      }
    });

    console.log(`✅ Document ${documentId} indexed successfully`);
  }

  /**
   * 從知識庫刪除文檔
   */
  static async removeDocument(documentId: number) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document || !document.chromaId) {
      return;
    }

    await RetrievalService.deleteDocument(document.chromaId);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        isIndexed: false,
        chromaId: null
      }
    });

    console.log(`✅ Document ${documentId} removed from index`);
  }
}
