import axios from 'axios';

const DIGITALOCEAN_TOKEN = process.env.DIGITALOCEAN_TOKEN || '';
const DEFAULT_MODEL = process.env.GRADIENT_MODEL_ID || 'gradient-ai/mixtral-8x7b-instruct-v0.1';

export interface AgentRunResponse {
  response: string;
  trace_id?: string;
}

/**
 * Invokes a managed DigitalOcean Agent using the OpenAI-compatible chat completions endpoint.
 */
export async function invokeAgent(agentUuid: string, deploymentName: string = 'development', payload: any, accessKey?: string) {
  const token = accessKey || DIGITALOCEAN_TOKEN;
  
  if (!token || token === 'MY_DIGITALOCEAN_TOKEN') {
    console.warn('No DigitalOcean Token or Access Key is configured. Falling back to mock response.');
    return {
      stance: 'NEUTRAL',
      confidence: 0.5,
      content: "I am a simulated response because the DigitalOcean Token is not configured.",
      reasoning: "Mock fallback triggered."
    };
  }

  try {
    // Determine the base URL based on the guide
    // If it's already a full URL, use it. Otherwise, construct it.
    let baseUrl = agentUuid.startsWith('http') 
      ? agentUuid 
      : `https://${agentUuid}.agents.do-ai.run`;
    
    // The guide shows both .agents.do-ai.run and .ondigitalocean.app
    // We'll stick to the one provided or the .run one as default.
    
    // Ensure it ends with the chat completions path: /api/v1/chat/completions
    // Some users might provide the full URL including /api/v1/...
    let url = baseUrl;
    if (!url.includes('/api/v1/chat/completions')) {
      url = `${url.replace(/\/$/, '')}/api/v1/chat/completions`;
    }

    // Transform the payload to the chat completions format
    const messages = [];
    if (payload.context?.system_instruction) {
      messages.push({ role: 'system', content: payload.context.system_instruction });
    }
    messages.push({ role: 'user', content: payload.prompt || payload.message || "Hello" });

    console.log(`[Agent API Request] URL: ${url}`);
    console.log(`[Agent API Request] Headers: ${JSON.stringify({
      'Authorization': `Bearer ${token.substring(0, 4)}...`,
      'Content-Type': 'application/json'
    })}`);
    console.log(`[Agent API Request] Body: ${JSON.stringify({
      messages,
      stream: false,
      include_retrieval_info: true,
      include_functions_info: true,
      include_guardrails_info: true
    }, null, 2)}`);

    const response = await axios.post(
      url,
      {
        messages,
        stream: false,
        max_tokens: 4096, // Increase token limit for reasoning models
        include_retrieval_info: true,
        include_functions_info: true,
        include_guardrails_info: true
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // Increase timeout for reasoning models
      }
    );

    console.log(`[Agent API Response] Status: ${response.status}`);
    // Log a truncated version of the data if it's huge
    console.log(`[Agent API Response] Data: ${JSON.stringify(response.data, null, 2)}`);

    const choice = response.data.choices?.[0];
    if (choice && choice.message) {
      const content = (choice.message.content || '').trim();
      const reasoning = (choice.message.reasoning_content || '').trim();
      
      if (content) {
        console.log(`[Agent API Response] Extracted Content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
        return content;
      }
      
      if (reasoning) {
        console.log(`[Agent API Response] Content empty, using reasoning_content: ${reasoning.substring(0, 100)}${reasoning.length > 100 ? '...' : ''}`);
        return reasoning;
      }
    }
    
    // Fallback for other response formats
    const fallbackContent = response.data.response || response.data;
    console.log(`[Agent API Response] Using Fallback Content Type: ${typeof fallbackContent}`);
    return typeof fallbackContent === 'string' ? fallbackContent : JSON.stringify(fallbackContent);
  } catch (error: any) {
    console.error(`[Agent API Error] Agent UUID: ${agentUuid}`);
    if (error.response) {
      console.error(`[Agent API Error] Status: ${error.response.status}`);
      console.error(`[Agent API Error] Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`[Agent API Error] Message: ${error.message}`);
    }
    throw new Error(`Agent invocation failed: ${error.message}`);
  }
}

/**
 * Lists all agents in the DigitalOcean account.
 */
export async function listAgents() {
  if (!DIGITALOCEAN_TOKEN || DIGITALOCEAN_TOKEN === 'MY_DIGITALOCEAN_TOKEN') {
    return [];
  }

  try {
    const response = await axios.get(
      'https://api.digitalocean.com/v2/gen-ai/agents',
      {
        headers: {
          'Authorization': `Bearer ${DIGITALOCEAN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return response.data.agents || [];
  } catch (error: any) {
    console.error('List Agents Error:', error.response?.data || error.message);
    return []; // Return empty array instead of throwing to prevent app crash
  }
}

/**
 * Fallback to Inference Hub if agents are not yet provisioned.
 */
export async function callInferenceHub(modelId: string, systemPrompt: string, userPrompt: string) {
  if (!DIGITALOCEAN_TOKEN || DIGITALOCEAN_TOKEN === 'MY_DIGITALOCEAN_TOKEN') {
    return {
      stance: 'NEUTRAL',
      confidence: 0.5,
      content: "I am a simulated response because the DigitalOcean Token is not configured.",
      reasoning: "Mock fallback triggered."
    };
  }

  try {
    // Try the most likely GenAI Inference URL
    const url = `https://api.digitalocean.com/v2/gen-ai/inference/v1/chat/completions`;
    console.log(`[Inference Hub Request] URL: ${url} Model: ${modelId}`);
    
    const response = await axios.post(
      url,
      {
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${DIGITALOCEAN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const choice = response.data.choices?.[0];
    if (choice && choice.message && choice.message.content) {
      const content = choice.message.content;
      try {
        return JSON.parse(content);
      } catch (e) {
        // If not JSON, return as content
        return {
          stance: 'NEUTRAL',
          confidence: 0.5,
          content: content,
          reasoning: "Parsed from plain text inference."
        };
      }
    }
    throw new Error("Invalid response structure from Inference Hub");
  } catch (error: any) {
    console.error(`[Inference Hub Error]`, error.response?.data || error.message);
    // Return a safe fallback object instead of throwing
    return {
      stance: 'NEUTRAL',
      confidence: 0.1,
      content: "I encountered an error while processing the request via Inference Hub.",
      reasoning: `Inference Hub failure: ${error.message}`
    };
  }
}
