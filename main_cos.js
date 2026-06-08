import { input } from "@inquirer/prompts";
import { scrollGeneric } from "./lib/qdrant.js";
import { spinner } from "./utils/spinner.js";

// 計算 cosine similarity
export function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const COLLECTION_NAME = "free"; // collection 名稱

async function main() {
    // 1. 取出所有
    const results = await scrollGeneric(COLLECTION_NAME);
    
    console.log(`共取得 ${results.length} 筆向量，開始計算相似度...`);

    // 2. 計算彼此之間相似度（兩兩 cosine）
    const n = results.length;
    let sum = 0;
    let count = 0;

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const v1 = results[i].vector;
            const v2 = results[j].vector;
            const sim = cosineSimilarity(v1, v2);
            console.log(`[${results[i].text}]-[${results[j].text}] 相似度：${sim.toFixed(2)}`);
            sum += sim;
            count++;
        }
    }
    // 3. 整體平均相似度
    const avg = count ? sum / count : 0;
    console.log(`整體平均相似度：${avg.toFixed(3)}`);

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});