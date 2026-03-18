export type Stance = 'YES' | 'NO' | 'NEUTRAL';

export interface Agent {
  id: string;
  name: string;
  personality: string;
  bias: string;
  riskTolerance: number; // 0 to 1
  influenceScore: number; // 0 to 1
  memory: string[];
  currentStance: Stance;
  confidence: number; // 0 to 1
  avatar: string;
  agentUuid?: string; // DigitalOcean Agent UUID
  deploymentName?: string; // DigitalOcean Deployment Name (e.g., 'development')
  accessKey?: string; // DigitalOcean Agent Access Key
}

export interface Message {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  round: number;
  stance: Stance;
  confidence: number;
  reasoning: string;
  timestamp: number;
}

export interface DebateState {
  topic: string;
  round: number;
  messages: Message[];
  agents: Agent[];
  moderatorId?: string;
  status: 'IDLE' | 'INTRO' | 'INITIAL_OPINIONS' | 'ARGUMENT' | 'COUNTERARGUMENT' | 'INFLUENCE_UPDATE' | 'VOTING' | 'FINAL_EXPLANATION' | 'COMPLETED';
  votingResults?: {
    YES: number;
    NO: number;
    NEUTRAL: number;
  };
}

export interface DebatePreset {
  id: string;
  name: string;
  agents: Agent[];
}
