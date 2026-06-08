import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_URL, QDRANT_API_KEY } from "../config.js";
import { client } from "./openai.js";

export const qdrant = new QdrantClient({
  url: QDRANT_URL,
  ...(QDRANT_API_KEY && { apiKey: QDRANT_API_KEY }),
});

export const NETFLIX_COLLECTION = "netflix";
export const EMBEDDING_DIM = 1536;
export const EMBEDDING_MODEL = "text-embedding-3-small";

export const COFFEE_COLLECTION = "coffee";

export async function embed(text) {
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}


export async function searchNetflix(query, limit = 5) {
  const vector = await embed(query);

  const results = await qdrant.search(NETFLIX_COLLECTION, {
    vector,
    limit,
    with_payload: true,
  });

  return results.map((r) => ({
    score: r.score,
    title: r.payload.title,
    type: r.payload.type,
    release_year: r.payload.release_year,
    description: r.payload.description,
    listed_in: r.payload.listed_in,
  }));
}

export async function searchCoffee(query, limit = 5) {
  const vector = await embed(query);

  const results = await qdrant.search(COFFEE_COLLECTION, {
    vector,
    limit,
    with_payload: true,
  });


  return results.map((r) => ({
         score: r.score,
        item:r.payload.item,
        description:r.payload.description,
        price:r.payload.price
  }));
}


export async function scrollGeneric(collectionName) {
  const res = await qdrant.scroll(collectionName, {
    limit: 10000,        // 假設最多 1 萬筆
    with_payload: true,
    with_vector: true,
  });

  return res.points.map((p) => ({
    id: p.id,
    vector: p.vector,
    text: p.payload?.text,
    payload: p.payload,
  }));
}