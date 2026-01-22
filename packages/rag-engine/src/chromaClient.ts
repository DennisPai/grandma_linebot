import { ChromaClient, Collection } from 'chromadb';

let client: ChromaClient | null = null;
let collection: Collection | null = null;

export async function getChromaClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({
      path: process.env.CHROMA_DB_PATH || 'http://localhost:8000'
    });
  }
  return client;
}

export async function getKnowledgeCollection(): Promise<Collection> {
  if (!collection) {
    const client = await getChromaClient();
    collection = await client.getOrCreateCollection({
      name: 'linebot_knowledge',
      metadata: {
        description: 'Line Bot knowledge base for RAG'
      }
    });
    console.log('✅ ChromaDB collection initialized');
  }
  return collection;
}

export async function resetCollection(): Promise<void> {
  const client = await getChromaClient();
  try {
    await client.deleteCollection({ name: 'linebot_knowledge' });
    console.log('🗑️ Collection deleted');
  } catch (error) {
    // Collection might not exist, ignore error
  }
  collection = null;
  await getKnowledgeCollection();
}
