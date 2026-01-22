import express from 'express';
import { prisma } from '../config/database.config.js';
import { RAGService } from '../services/ragService.js';

const router = express.Router();

// 新增文檔
router.post('/', async (req, res) => {
  try {
    const { title, content, category, tags, uploadedBy } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    // 建立文檔
    const document = await prisma.document.create({
      data: {
        title,
        content,
        category: category || '未分類',
        tags: tags || [],
        uploadedBy: uploadedBy || 'admin',
        uploadedAt: new Date()
      }
    });

    // 自動向量化並索引
    await RAGService.addDocument(document.id);

    res.json({ success: true, document });
  } catch (error: any) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: error.message });
  }
});

// 取得所有文檔
router.get('/', async (req, res) => {
  try {
    const category = req.query.category as string;
    
    const documents = await prisma.document.findMany({
      where: category ? { category } : undefined,
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ documents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 刪除文檔
router.delete('/:id', async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    // 從向量庫移除
    await RAGService.removeDocument(documentId);

    // 從資料庫刪除
    await prisma.document.delete({
      where: { id: documentId }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 測試 RAG 檢索
router.post('/test-retrieval', async (req, res) => {
  try {
    const { query, topK } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const results = await RAGService.retrieveRelevant(query, [], { topK: topK || 5 });
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
