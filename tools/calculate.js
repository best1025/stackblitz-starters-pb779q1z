// tools/weather.js
import { z } from 'zod';
import { OPENWEATHER_API_KEY } from '../config.js';
import { defineTool } from '../utils/func-tool.js';

export const calculateTool = defineTool({
  name: 'get_calculate',
  description: '進行數學計算',
  fn: getCalculate,
  parameters: z.object({
    data: z.string().describe('計算的字串，如:1+3*5'),
  }),
});

export const getCalculateTool = {
  type: 'function',
  function: {
    name: 'get_calculate',
    description: '進行數學計算',
    parameters: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: '計算的字串，如:1+3*5',
        },
      },
      required: ['data'],
    },
  },
};

export async function getCalculate({ data }) {
  // 1. 驗證：只允許數字、小數點、+ - * / () 和空白
  const safePattern = /^[0-9+\-*/().\s]+$/;
  if (!safePattern.test(data)) {
    throw new Error('輸入格式不合法，只能包含數字與四則運算符號');
  }

  let result;
  try {
    // 2. 計算字串表達式，例如 "1+3*5/4" -> 4.75
    result = new Function(`return ${data}`)();

    // 3. 確認是有效數字
    if (typeof result !== 'number' || Number.isNaN(result)) {
      throw new Error('計算結果不是有效數字');
    }
  } catch (err) {
    throw new Error('計算失敗：' + err.message);
  }
  // 4. 回傳「文字」（字串），例如 "4.75"

  return { cal_result: String(result) };
}
