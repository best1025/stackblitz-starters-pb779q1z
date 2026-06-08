
import { client } from "../lib/openai.js";
import { qdrant, EMBEDDING_DIM, EMBEDDING_MODEL } from "../lib/qdrant.js";

const BATCH_SIZE = 100;

/**
 * 重新建立指定 collection
 */
async function recreateCollection(collectionName) {
  const exists = await qdrant.collectionExists(collectionName);
  if (exists.exists) {
    await qdrant.deleteCollection(collectionName);
  }
  await qdrant.createCollection(collectionName, {
    vectors: { size: EMBEDDING_DIM, distance: "Cosine" },
  });
}

/**
 * 對一批文字做 embedding
 */
async function embedBatch(texts) {
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts, // 直接吃 string[]
  });
  return res.data.map((d) => d.embedding);
}

/**
 * 通用：把一個文字陣列寫入指定的 Qdrant collection
 * @param {Object} params
 * @param {string} params.collectionName - Qdrant collection 名稱
 * @param {string[]} params.texts - 要做 embedding 的文字陣列
 */
export async function indexTextsToCollection({ collectionName, texts }) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("texts 必須是非空的 string[]");
  }

  console.log(`準備將 ${texts.length} 筆文字寫入 collection: ${collectionName}`);

  await recreateCollection(collectionName);
  console.log(`已建立 / 重建 collection: ${collectionName}`);

  let processed = 0;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batchTexts = texts.slice(i, i + BATCH_SIZE);
    const vectors = await embedBatch(batchTexts);

    const points = batchTexts.map((text, idx) => ({
      id: i + idx,          // 以 index 當 id，如需自訂可改這裡
      vector: vectors[idx],
      payload: {
        text,               // 通用 payload：至少存原始文字
      },
    }));

    await qdrant.upsert(collectionName, { wait: true, points });
    processed += batchTexts.length;
    console.log(`進度：${processed} / ${texts.length}`);
  }

  console.log(`完成寫入 collection: ${collectionName}`);
}
  
/**
 * 範例：直接用 list 呼叫
 */
async function demo() {
  const texts = ["今天天氣很好", "我要去買菜","電腦壞了"];
  await indexTextsToCollection({
    collectionName: "conversation",
    texts,
  });
}

demo().catch((err) => {
  console.error(err);
  process.exit(1);
});

