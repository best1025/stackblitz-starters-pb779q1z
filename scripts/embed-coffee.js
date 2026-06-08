import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { client } from '../lib/openai.js';
import { qdrant, COFFEE_COLLECTION, EMBEDDING_DIM } from '../lib/qdrant.js';

const CSV_PATH = 'data/coffee.csv';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 100;

function rowToText(row) {
  return [
    row.item,
    row.description,
    row.price
  ]
    .filter(Boolean)
    .join(' | ');
}



async function recreateCollection() {
  const exists = await qdrant.collectionExists(COFFEE_COLLECTION);
  if (exists.exists) {
    await qdrant.deleteCollection(COFFEE_COLLECTION);
  }
  await qdrant.createCollection(COFFEE_COLLECTION, {
    vectors: { size: EMBEDDING_DIM, distance: 'Cosine' },
  });
}

async function embedBatch(texts) {
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    check_compatibility: false,
  });
  return res.data.map((d) => d.embedding);
}

async function main() {
  const csv = await readFile(CSV_PATH, 'utf8');
  const rows = parse(csv, { columns: true, skip_empty_lines: true });
  console.log(`讀到 ${rows.length} 筆資料`);

  await recreateCollection();
  console.log(`已建立 collection: ${COFFEE_COLLECTION}`);

  let processed = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const texts = batch.map(rowToText);
    const vectors = await embedBatch(texts);

    const points = batch.map((row, idx) => ({
        id: i + idx,
        vector: vectors[idx],
        payload: {
        item:row.item,
        description:row.description,
        price:row.price
      },
    }));

    await qdrant.upsert(COFFEE_COLLECTION, { wait: true, points });
    processed += batch.length;
    console.log(`進度：${processed} / ${rows.length}`);
  }

  console.log('完成！');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
