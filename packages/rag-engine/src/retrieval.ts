import { getKnowledgeCollection } from './chromaClient.js';
import { EmbeddingService } from './embedding.js';

export interface RetrievalOptions {
  topK: number;
  categoryFilter?: string;
}

export interface RetrievalResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  distance: number;
}

export class RetrievalService {
  /**
   * 檢索相關文檔
   */
  static async retrieveRelevant(
    query: string,
    userInterests: string[] = [],
    options: RetrievalOptions = { topK: 3 }
  ): Promise<RetrievalResult[]> {
    try {
      const collection = await getKnowledgeCollection();

      // 1. 生成查詢向量
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);

      // 2. 從 ChromaDB 檢索相似文檔
      const whereClause = options.categoryFilter
        ? { category: { $eq: options.categoryFilter } }
        : undefined;

      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: options.topK * 2, // 取兩倍數量，後續過濾
        where: whereClause
      });

      if (!results.documents || results.documents.length === 0) {
        return [];
      }

      // 3. 格式化結果
      const formattedResults: RetrievalResult[] = [];
      const documents = results.documents[0];
      const metadatas = results.metadatas?.[0] || [];
      const distances = results.distances?.[0] || [];
      const ids = results.ids[0];

      for (let i = 0; i < documents.length; i++) {
        formattedResults.push({
          id: ids[i],
          content: documents[i] || '',
          metadata: (metadatas[i] as Record<string, any>) || {},
          distance: distances[i] || 0
        });
      }

      // 4. 根據用戶興趣重新排序（如果有）
      const rankedResults = this.reRankByUserInterests(
        formattedResults,
        userInterests
      );

      return rankedResults.slice(0, options.topK);
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
  }

  /**
   * 根據用戶興趣重新排序
   */
  private static reRankByUserInterests(
    results: RetrievalResult[],
    userInterests: string[]
  ): RetrievalResult[] {
    if (!userInterests || userInterests.length === 0) {
      return results;
    }

    return results.sort((a, b) => {
      const aScore = this.calculateInterestScore(a, userInterests);
      const bScore = this.calculateInterestScore(b, userInterests);
      
      // 興趣分數高的優先，相同則按距離排序
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      return a.distance - b.distance;
    });
  }

  /**
   * 計算文檔與用戶興趣的匹配分數
   */
  private static calculateInterestScore(
    result: RetrievalResult,
    userInterests: string[]
  ): number {
    let score = 0;
    const contentLower = result.content.toLowerCase();
    const tagsLower = (result.metadata.tags || [])
      .map((t: string) => t.toLowerCase());

    for (const interest of userInterests) {
      const interestLower = interest.toLowerCase();
      
      // 內容包含興趣關鍵字
      if (contentLower.includes(interestLower)) {
        score += 2;
      }

      // 標籤匹配
      if (tagsLower.some((tag: string) => tag.includes(interestLower))) {
        score += 3;
      }

      // 分類匹配
      if (result.metadata.category?.toLowerCase().includes(interestLower)) {
        score += 5;
      }
    }

    return score;
  }

  /**
   * 新增文檔到向量庫
   */
  static async addDocument(
    id: string,
    content: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const collection = await getKnowledgeCollection();

    // 生成向量
    const embedding = await EmbeddingService.generateEmbedding(content);

    // 新增到 ChromaDB
    await collection.add({
      ids: [id],
      embeddings: [embedding],
      metadatas: [metadata],
      documents: [content]
    });

    console.log(`✅ Document ${id} added to vector database`);
  }

  /**
   * 刪除文檔
   */
  static async deleteDocument(id: string): Promise<void> {
    const collection = await getKnowledgeCollection();
    await collection.delete({ ids: [id] });
    console.log(`🗑️ Document ${id} deleted from vector database`);
  }
}
