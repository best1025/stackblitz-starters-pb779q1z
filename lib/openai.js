//模組化
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config.js';
const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const DEFAULT_MODEL = 'gpt-4o-2024-05-13';

export { client, DEFAULT_MODEL };
