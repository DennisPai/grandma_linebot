import { GoogleGenerativeAI } from '@google/generative-ai';

export class EmbeddingService {
  /**
   * 使用 Gemini 生成文本向量
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    // 使用免費 KEY
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_FREE || '');
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * 批量生成向量
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }
}
