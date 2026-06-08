import { client, DEFAULT_MODEL } from './lib/openai.js';
import { spinner } from './utils/spinner.js';
import { toOpenAITool } from './utils/func-tool.js';
import * as allTools from './tools/index.js';
import { input } from '@inquirer/prompts';

const toolList = Object.values(allTools);
const tools = toolList.map(toOpenAITool);
const AVAILABLE_TOOLS = Object.fromEntries(toolList.map((t) => [t.name, t.fn]));

try {
  const messages = [];

  messages.push({
    role: 'developer',
    content: `天氣與時間助手，協助使用者回答有關天氣與時間的問題。`,
  });

  console.log(
    '🤖 您好，天氣與時間助手，你可以詢問我任何關於天氣與時間的問題。\n'
  );

  while (1) {
    const userQuestion = (await input({ message: '請輸入你的問題：' })).trim();

    if (userQuestion === '') continue;
    if (userQuestion.toLowerCase() === 'exit') {
      console.log('再會~');
      break;
    }

    messages.push({ role: 'user', content: userQuestion + '\n' });
    while (true) {
      const spin = spinner('思考中...').start();

      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        tools,
        tool_choice: 'auto',
      });

      spin.stop();

      const message = response.choices[0].message;
      messages.push(message);

      if (!message.tool_calls || message.tool_calls.length === 0) {
        console.log(message.content);
        break;
      }

      for (const toolCall of message.tool_calls) {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`\n[呼叫 tool] ${fnName}(${JSON.stringify(args)})`);

        const fn = AVAILABLE_TOOLS[fnName];
        const result = await fn(args);

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }
  }
} catch (err) {
  if (err.name === 'ExitPromptError') {
    console.log('\n bye~');
  } else {
    console.log(err.name);
    throw err;
  }
}
