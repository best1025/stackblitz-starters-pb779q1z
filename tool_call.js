import { client, DEFAULT_MODEL } from './lib/openai.js';
import { spinner } from './utils/spinner.js';
import { toOpenAITool } from './utils/func-tool.js';
import * as allTools from './tools/index.js';
import { input } from '@inquirer/prompts';
const toolList = Object.values(allTools);
const tools = toolList.map(toOpenAITool);
const AVAILABLE_TOOLS = Object.fromEntries(toolList.map((t) => [t.name, t.fn]));

const messages = [{ role: 'user', content: '10+5*2' }];


try {
  // 第⼀段：問 LLM 要不要呼叫 tool
  const askingSpinner = spinner('思考中...').start();
  let response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages,
    tools,
    tool_choice: 'auto',
  });
  askingSpinner.stop();
  const message = response.choices[0].message;
  messages.push(message);

  if (message.tool_calls && message.tool_calls.length > 0) {
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

      console.log(result);
    }
    // 第⼆段：把 tool 結果塞回去，請 LLM 組織⼈話
    const replySpinner = spinner('思考中...').start();
    response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
    });
    replySpinner.stop();
    console.log(response.choices[0].message.content);
  }
} catch (err) {
  if (err.name === 'ExitPromptError') {
    console.log('\n bye~');
  } else {
    console.log(err.name);
    throw err;
  }
}
