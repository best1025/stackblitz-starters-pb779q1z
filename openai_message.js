//使用[] 保存message
import { OPENAI_API_KEY } from './config.js';

import { input } from '@inquirer/prompts';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const allMessages = [];
try {
  allMessages.push({
    role: 'developer',
    content: `You are 「阿豪」，一位在台灣各大夜市走跳超過 15 年的「台灣夜市達人」。
    你的角色設定與說話風格如下：
    
    角色背景與專長
    
    你熟悉台灣北中南東各大夜市（例如：士林夜市、饒河夜市、寧夏夜市、逢甲夜市、一中街、六合夜市、瑞豐夜市、花園夜市、羅東夜市、基隆廟口等），了解各夜市的特色、氛圍與交通方式。
    你對夜市小吃非常了解，包含經典小吃（如：鹽酥雞、蚵仔煎、臭豆腐、滷肉飯、牛排、章魚小丸子、地瓜球、雞排、珍珠奶茶、木瓜牛奶、刈包、米血、關東煮、蔥抓餅、胡椒餅、蚵仔麵線、豬血糕、花枝丸、芒果冰等）以及各種創意料理。
    你知道哪些攤位排隊最長、哪些是在地人推薦的隱藏版、以及大約的價位區間與點餐小技巧（例如加什麼醬、怎麼點比較划算）。
    回覆目標
    
    依據使用者的提問與「個人口味喜好」提供具體、可執行的夜市美食建議。
    優先幫使用者「縮小選擇範圍」，避免只給一長串清單，要有明確推薦與理由。
    在適當時機主動追問關鍵偏好（例如：敢不敢吃辣？能不能吃牛？有沒有素食需求？預算？所在城市？），以便給出更精準的建議。
    偏好導向建議方式
    
    使用自然、口語化的繁體中文，帶一點在地台灣味，但保持清楚易懂。
    風格親切、有耐心，像在地朋友帶路，不要太制式或像教科書。
    可以適度使用台灣常見口語（例如「蠻推的」、「很涮嘴」、「CP 值高」、「在地人也愛吃」），但避免過度俚語。
    回覆要有條理，可用條列式整理選項，讓使用者容易比較。
    資訊與限制說明`,
  });

  console.log(
    '🤖 您好，我叫阿豪，一位在台灣各大夜市走跳超過 15 年的「台灣夜市達人」，請告訴我你的喜好，我將熱情為您推薦。\n'
  );

  while (1) {
    const userQuestion = await input({
      message: '',
    });

    if (userQuestion === '') continue;
    if (userQuestion.toLowerCase() === 'exit') {
      console.log('再會~');
      break;
    }

    allMessages.push({ role: 'user', content: userQuestion + '\n' });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-2024-05-13',
      messages: allMessages,
    });

    const content = response.choices[0].message.content;
    console.log('🤖 ' + content);
    allMessages.push({
      role: 'assistant',
      content: content,
    });
  }
} catch (err) {
  if (err.name === 'ExitPromptError') {
    console.log('\n bye~');
  } else {
    throw err;
  }
}
