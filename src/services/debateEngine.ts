import { Agent, DebateState, Message, Stance, DebatePreset } from '../types';
import { invokeAgent, callInferenceHub } from './gradientService';

const DEFAULT_MODEL = process.env.GRADIENT_MODEL_ID || 'gradient-ai/mixtral-8x7b-instruct-v0.1';

export const SCIENTISTS_PRESET: DebatePreset = {
  id: 'scientists',
  name: 'Scientists',
  agents: [
    {
      id: 'dr_elara',
      name: 'Dr. Elara Vance',
      personality: 'Pragmatic, data-driven, skeptical of unproven theories.',
      bias: 'Technological optimism, but grounded in physical limits.',
      riskTolerance: 0.3,
      influenceScore: 0.8,
      memory: [],
      currentStance: 'NEUTRAL',
      confidence: 0.5,
      avatar: 'https://i.ibb.co/yntrRZP9/Elara-Vance.png',
      agentUuid: process.env.AGENT_ELARA_UUID || 'aq64ljvls6vayemhrequh5oh',
      deploymentName: 'development',
      accessKey: process.env.AGENT_ELARA_KEY || '7tfDBg-p5w0mlp78VAgYMxTUw90zMPZi'
    },
    {
      id: 'prof_kael',
      name: 'Prof. Kaelen Thorne',
      personality: 'Visionary, theoretical, willing to take intellectual risks.',
      bias: 'Belief in radical breakthroughs and paradigm shifts.',
      riskTolerance: 0.8,
      influenceScore: 0.7,
      memory: [],
      currentStance: 'NEUTRAL',
      confidence: 0.5,
      avatar: 'https://i.ibb.co/HfjgdNm3/Kaelen.png',
      agentUuid: process.env.AGENT_KAEL_UUID || 'prji2k2xljzxp5ebhrtjytez',
      deploymentName: 'development',
      accessKey: process.env.AGENT_KAEL_KEY || 'xAZorwBIoNjFvmwig7YGUG-VQZvOvmeI'
    },
    {
      id: 'dr_mira',
      name: 'Dr. Mira Sato',
      personality: 'Ethical, cautious, focused on long-term societal impact.',
      bias: 'Precautionary principle, concern for unintended consequences.',
      riskTolerance: 0.2,
      influenceScore: 0.6,
      memory: [],
      currentStance: 'NEUTRAL',
      confidence: 0.5,
      avatar: 'https://i.ibb.co/fzp1h49K/Mira-Sato.png',
      agentUuid: process.env.AGENT_MIRA_UUID || 'rlxy22yiv6le7aslp4fsuq6r',
      deploymentName: 'development',
      accessKey: process.env.AGENT_MIRA_KEY || '-jLFh4mt87bsqHlbJ9BrF4TcN8BEsHkJ'
    },
    {
      id: 'dr_silas',
      name: 'Dr. Silas Vane',
      personality: 'Competitive, results-oriented, slightly arrogant.',
      bias: 'Efficiency and speed over consensus.',
      riskTolerance: 0.6,
      influenceScore: 0.5,
      memory: [],
      currentStance: 'NEUTRAL',
      confidence: 0.5,
      avatar: 'https://i.ibb.co/PzMb2gnM/Silas-Vane.png',
      agentUuid: process.env.AGENT_SILAS_UUID || 'lqwohool4c5cygxzr4tbop2v',
      deploymentName: 'development',
      accessKey: process.env.AGENT_SILAS_KEY || 'qkgqPxnXv_4CtrfhgADlxxS7k8BXDXv_'
    },
    {
      id: 'dr_anya',
      name: 'Dr. Anya Petrova',
      personality: 'Collaborative, empathetic, seeks common ground.',
      bias: 'Interdisciplinary approaches and holistic thinking.',
      riskTolerance: 0.4,
      influenceScore: 0.4,
      memory: [],
      currentStance: 'NEUTRAL',
      confidence: 0.5,
      avatar: 'https://i.ibb.co/d1nvkpG/Anya-Petrova.png',
      agentUuid: process.env.AGENT_ANYA_UUID || 'tgyabuvd2gim2se7p74dl2mf',
      deploymentName: 'development',
      accessKey: process.env.AGENT_ANYA_KEY || 'ZusTyhdD4iu-cdKUpDtdywg-x9_1hlrK'
    }
  ]
};

export class DebateOrchestrator {
  private state: DebateState;

  constructor(topic: string, preset: DebatePreset) {
    const agents = JSON.parse(JSON.stringify(preset.agents));
    const moderatorIndex = Math.floor(Math.random() * agents.length);
    const moderatorId = agents[moderatorIndex].id;

    this.state = {
      topic,
      round: 0,
      messages: [],
      agents,
      moderatorId,
      status: 'IDLE'
    };
  }

  getState() {
    return this.state;
  }

  async runNextRound() {
    console.log(`Transitioning from ${this.state.status} (Round ${this.state.round})`);
    switch (this.state.status) {
      case 'IDLE':
        this.state.status = 'INITIAL_OPINIONS';
        await this.generateOpinions();
        break;
      case 'INITIAL_OPINIONS':
        this.state.status = 'ARGUMENT';
        await this.generateArguments();
        break;
      case 'ARGUMENT':
        this.state.status = 'COUNTERARGUMENT';
        await this.generateCounterArguments();
        break;
      case 'COUNTERARGUMENT':
        this.state.status = 'INFLUENCE_UPDATE';
        this.updateInfluence();
        // Automatically proceed to voting for better UX
        this.state.status = 'VOTING';
        this.runVoting();
        break;
      case 'VOTING':
        this.state.status = 'FINAL_EXPLANATION';
        await this.generateFinalExplanation();
        break;
      case 'FINAL_EXPLANATION':
        this.state.status = 'COMPLETED';
        break;
    }
    this.state.round++;
    console.log(`New status: ${this.state.status} (Round ${this.state.round})`);
    return JSON.parse(JSON.stringify(this.state));
  }

  private get topic() {
    return this.state.topic;
  }

  private async invokeAgentWithRouting(agent: Agent, userPrompt: string, systemPrompt: string) {
    console.log(`Invoking agent: ${agent.name} (${agent.agentUuid || 'Inference Hub'})`);
    let rawResponse;
    try {
      if (agent.agentUuid) {
        rawResponse = await invokeAgent(agent.agentUuid, agent.deploymentName || 'development', { 
          prompt: userPrompt,
          context: { system_instruction: systemPrompt }
        }, agent.accessKey);
      } else {
        rawResponse = await callInferenceHub(DEFAULT_MODEL, systemPrompt, userPrompt);
      }
      return this.parseAgentResponse(rawResponse);
    } catch (error) {
      console.error(`Failed to invoke agent ${agent.name}:`, error);
      try {
        const fallback = await callInferenceHub(DEFAULT_MODEL, systemPrompt, userPrompt);
        return this.parseAgentResponse(fallback);
      } catch (fallbackError) {
        console.error(`Fallback failed for ${agent.name}:`, fallbackError);
        return {
          stance: 'NEUTRAL',
          confidence: 0.1,
          content: "I'm having trouble connecting to the council's communication network.",
          reasoning: "Connection failure."
        };
      }
    }
  }

  private parseAgentResponse(response: any): any {
    console.log(`[DebateEngine] Parsing agent response. Type: ${typeof response}`);
    if (typeof response === 'string') {
      console.log(`[DebateEngine] Raw string response: "${response.substring(0, 200)}${response.length > 200 ? '...' : ''}"`);
      try {
        // Try to extract JSON if it's wrapped in markdown or other text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              content: parsed.content || parsed.text || parsed.message || response,
              stance: parsed.stance || 'NEUTRAL',
              confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
              reasoning: parsed.reasoning || 'Parsed from JSON.'
            };
          } catch (e) {
            // If JSON parsing fails, fall back to raw text
          }
        }
        return {
          content: response.trim() || "No content provided.",
          stance: 'NEUTRAL',
          confidence: 0.5,
          reasoning: 'Parsed from plain text response.'
        };
      } catch (e) {
        return {
          content: response,
          stance: 'NEUTRAL',
          confidence: 0.5,
          reasoning: 'Failed to parse JSON, using raw text.'
        };
      }
    }
    
    // If it's already an object, ensure it has the required fields
    if (typeof response === 'object' && response !== null) {
      // Handle DigitalOcean Agent Platform's "response" wrapper if it exists
      if (response.response && typeof response.response === 'string') {
        return this.parseAgentResponse(response.response);
      }
      
      return {
        content: response.content || response.text || response.message || "No content provided.",
        stance: response.stance || 'NEUTRAL',
        confidence: typeof response.confidence === 'number' ? response.confidence : 0.5,
        reasoning: response.reasoning || "No reasoning provided."
      };
    }

    return {
      content: "Communication error.",
      stance: 'NEUTRAL',
      confidence: 0,
      reasoning: "Invalid response type."
    };
  }

  private async generateOpinions() {
    const debaters = this.state.agents.filter(a => a.id !== this.state.moderatorId);
    const tasks = debaters.map(async (agent) => {
      const systemPrompt = this.getAgentSystemPrompt(agent);
      const userPrompt = `The topic is: "${this.state.topic}". Provide your initial opinion. 
      Respond in JSON format: { "stance": "YES" | "NO" | "NEUTRAL", "confidence": 0-1, "content": "your opinion", "reasoning": "your internal logic" }`;
      
      try {
        const response = await this.invokeAgentWithRouting(agent, userPrompt, systemPrompt);
        this.addMessage(agent, response);
      } catch (error) {
        console.error(`Error generating opinion for ${agent.name}:`, error);
        // Fallback to a neutral stance if agent fails
        this.addMessage(agent, {
          stance: 'NEUTRAL',
          confidence: 0.1,
          content: "I am currently processing the data and will provide my input shortly.",
          reasoning: "Agent invocation failed, using fallback."
        });
      }
    });
    await Promise.all(tasks);
  }

  private async generateArguments() {
    const history = this.getDebateHistory();
    const debaters = this.state.agents.filter(a => a.id !== this.state.moderatorId);
    const tasks = debaters.map(async (agent) => {
      const systemPrompt = this.getAgentSystemPrompt(agent);
      const userPrompt = `Topic: "${this.topic}". 
      Debate History: ${history}
      Based on the initial opinions, provide a strong argument for your position. 
      Respond in JSON format: { "stance": "YES" | "NO" | "NEUTRAL", "confidence": 0-1, "content": "your argument", "reasoning": "your internal logic" }`;
      
      try {
        const response = await this.invokeAgentWithRouting(agent, userPrompt, systemPrompt);
        this.addMessage(agent, response);
      } catch (error) {
        console.error(`Error generating argument for ${agent.name}:`, error);
      }
    });
    await Promise.all(tasks);
  }

  private async generateCounterArguments() {
    const history = this.getDebateHistory();
    const debaters = this.state.agents.filter(a => a.id !== this.state.moderatorId);
    const tasks = debaters.map(async (agent) => {
      const systemPrompt = this.getAgentSystemPrompt(agent);
      const userPrompt = `Topic: "${this.topic}". 
      Debate History: ${history}
      Address the arguments made by others. You may change your stance if convinced. 
      Respond in JSON format: { "stance": "YES" | "NO" | "NEUTRAL", "confidence": 0-1, "content": "your counterargument", "reasoning": "your internal logic" }`;
      
      try {
        const response = await this.invokeAgentWithRouting(agent, userPrompt, systemPrompt);
        this.addMessage(agent, response);
      } catch (error) {
        console.error(`Error generating counter-argument for ${agent.name}:`, error);
      }
    });
    await Promise.all(tasks);
  }

  private updateInfluence() {
    // Logic to update influence scores based on argument strength (simulated for now)
    // In a real system, another LLM call could evaluate argument quality
    this.state.agents.forEach(agent => {
      const lastMsg = this.state.messages.filter(m => m.agentId === agent.id).pop();
      if (lastMsg && lastMsg.confidence > 0.8) {
        agent.influenceScore = Math.min(1, agent.influenceScore + 0.05);
      }
    });
  }

  private runVoting() {
    const results = { YES: 0, NO: 0, NEUTRAL: 0 };
    const debaters = this.state.agents.filter(a => a.id !== this.state.moderatorId);
    debaters.forEach(agent => {
      results[agent.currentStance]++;
    });
    this.state.votingResults = results;
  }

  private async generateFinalExplanation() {
    const moderator = this.state.agents.find(a => a.id === this.state.moderatorId);
    if (!moderator) {
      // Fallback if no moderator selected
      const systemPrompt = "You are the Debate Moderator.";
      const history = this.getDebateHistory();
      const userPrompt = `Topic: "${this.state.topic}". 
      Debate History: ${history}
      Voting Results: YES: ${this.state.votingResults?.YES}, NO: ${this.state.votingResults?.NO}, NEUTRAL: ${this.state.votingResults?.NEUTRAL}
      Provide a final summary of the debate and the outcome. 
      Respond in JSON format: { "content": "summary text" }`;
      
      const response = await callInferenceHub(DEFAULT_MODEL, systemPrompt, userPrompt);
      this.state.messages.push({
        id: Math.random().toString(36).substr(2, 9),
        agentId: 'moderator',
        agentName: 'Moderator',
        content: response.content,
        round: this.state.round,
        stance: 'NEUTRAL',
        confidence: 1,
        reasoning: 'Final summary',
        timestamp: Date.now()
      });
      return;
    }

    const systemPrompt = `You are ${moderator.name}, acting as the Debate Moderator. 
    Personality: ${moderator.personality}
    Bias: ${moderator.bias}`;
    
    const history = this.getDebateHistory();
    const userPrompt = `Topic: "${this.state.topic}". 
    Debate History: ${history}
    Voting Results: YES: ${this.state.votingResults?.YES}, NO: ${this.state.votingResults?.NO}, NEUTRAL: ${this.state.votingResults?.NEUTRAL}
    Provide a final summary of the debate and the outcome from your perspective as ${moderator.name}. 
    Respond in JSON format: { "content": "summary text" }`;
    
    const response = await this.invokeAgentWithRouting(moderator, userPrompt, systemPrompt);
    this.state.messages.push({
      id: Math.random().toString(36).substr(2, 9),
      agentId: moderator.id,
      agentName: `${moderator.name} (Moderator)`,
      content: response.content,
      round: this.state.round,
      stance: 'NEUTRAL',
      confidence: 1,
      reasoning: 'Final summary as moderator',
      timestamp: Date.now()
    });
  }

  private addMessage(agent: Agent, response: any) {
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      agentId: agent.id,
      agentName: agent.name,
      content: response.content,
      round: this.state.round,
      stance: response.stance as Stance,
      confidence: response.confidence,
      reasoning: response.reasoning,
      timestamp: Date.now()
    };
    
    this.state.messages.push(message);
    
    // Update agent state
    agent.currentStance = response.stance as Stance;
    agent.confidence = response.confidence;
    agent.memory.push(response.content);
  }

  private getAgentSystemPrompt(agent: Agent) {
    return `You are ${agent.name}. 
    Personality: ${agent.personality}
    Bias: ${agent.bias}
    Risk Tolerance: ${agent.riskTolerance}
    Influence Score: ${agent.influenceScore}
    You are participating in a multi-agent debate. 
    Stay consistent with your personality but be open to changing your mind if presented with high-confidence, logical arguments from high-influence agents.`;
  }

  private getDebateHistory() {
    return this.state.messages.map(m => `${m.agentName} (${m.stance}): ${m.content}`).join('\n');
  }
}
