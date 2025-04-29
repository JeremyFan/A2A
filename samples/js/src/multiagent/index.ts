import { genkit } from "genkit/beta";
import { gemini20Flash, googleAI } from "@genkit-ai/googleai";
import {
  AgentCard,
} from "../schema.js";

export const ai = genkit({
  plugins: [googleAI()],
  model: gemini20Flash,
});

/**
 * 一次性获取所有 agent 与用户输入消息的匹配分数。
 * @param message 用户输入的消息
 * @param agentCardList 现有 agent 的能力描述列表
 * @returns 包含每个 agent 名称和对应分数的数组
 */
export async function agentSelect(message: string, agentCardList: AgentCard[]) {
  // 构造agent描述信息
  const agentDescriptions = agentCardList.map((agent, idx) =>
    `Agent${idx + 1}:
    名称: ${agent.name}
    描述: ${agent.description || '无描述'}
    输入模式: ${(agent.defaultInputModes || []).join(', ')}
    输出模式: ${(agent.defaultOutputModes || []).join(', ')}
    能力: ${agent.capabilities ? JSON.stringify(agent.capabilities) : '无特殊能力'}
    `
  ).join('\n');

  // 构造prompt
  const prompt = `你是一个智能agent选择器。请根据以下用户输入和agent列表，评估每个agent对用户请求的匹配程度。

用户输入: ${message}

可用的agent列表:
${agentDescriptions}

请为每个agent打分(0-1之间)，分数越高表示越适合处理当前请求。
请以JSON数组形式返回结果，格式如下:
[
  {"name": "agent名称", "score": 0.8, "reason": "简短说明匹配原因"},
  ...
]

只返回JSON数组，不要其他解释。`;

  // 调用genkit
  const response = await ai.generate({ prompt, output: { format: 'json' }, });

  console.log('---res', response.message.content)

  try {
    // 解析返回的JSON
    const result = JSON.parse(response.text);
    if (Array.isArray(result)) {

      console.log('Agent select result:\n', result)

      const matched = result.sort((a, b) => b.score - a.score)[0]

      return matched;
    }
    return [];
  } catch (e) {
    console.error('解析agent选择结果失败:', e);
    return [];
  }
}

