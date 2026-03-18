import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  MessageSquare, 
  Vote, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  RefreshCcw,
  User,
  Brain,
  ShieldAlert,
  Zap,
  Heart,
  Download,
  PlusCircle
} from 'lucide-react';
import { Agent, DebateState, Message, Stance } from './types';

const StanceBadge = ({ stance }: { stance: Stance }) => {
  const colors = {
    YES: 'bg-brand-pink/10 text-brand-pink border-brand-pink/20',
    NO: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
    NEUTRAL: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[stance]}`}>
      {stance}
    </span>
  );
};

const AgentCard = ({ agent, isModerator }: { agent: Agent, isModerator?: boolean, key?: any }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-brand-dark/50 border ${isModerator ? 'border-brand-blue/50 ring-1 ring-brand-blue/20' : 'border-slate-800'} rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden`}
  >
    {isModerator && (
      <div className="absolute top-0 right-0 bg-brand-blue text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">
        Moderator
      </div>
    )}
    <div className="flex items-center gap-3">
      <div className="relative">
        <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-full border-2 border-slate-700" />
        <div className="absolute -bottom-1 -right-1 bg-brand-dark rounded-full p-1 border border-slate-700">
          <StanceBadge stance={agent.currentStance} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{agent.name}</h3>
        <p className="text-[10px] text-slate-400 italic line-clamp-1">{agent.personality}</p>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-2 text-[10px]">
      <div className="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">
        <div className="flex items-center gap-1 text-slate-400 mb-1">
          <TrendingUp size={10} />
          <span>Influence</span>
        </div>
        <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
          <div className="bg-brand-pink h-full transition-all duration-500" style={{ width: `${agent.influenceScore * 100}%` }} />
        </div>
      </div>
      <div className="bg-slate-800/50 p-1.5 rounded border border-slate-700/50">
        <div className="flex items-center gap-1 text-slate-400 mb-1">
          <Zap size={10} />
          <span>Confidence</span>
        </div>
        <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
          <div className="bg-brand-blue h-full transition-all duration-500" style={{ width: `${agent.confidence * 100}%` }} />
        </div>
      </div>
    </div>
  </motion.div>
);

const MessageItem = ({ message, agent }: { message: Message, agent?: Agent, key?: any }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex gap-4 mb-6"
  >
    <div className="flex-shrink-0">
      <img src={agent?.avatar || 'https://picsum.photos/seed/mod/100/100'} alt={message.agentName} className="w-10 h-10 rounded-full border border-slate-700" />
    </div>
    <div className="flex-grow">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-bold text-slate-200">{message.agentName}</span>
        <StanceBadge stance={message.stance} />
        <span className="text-[10px] text-slate-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl rounded-tl-none p-4 text-sm text-slate-300 leading-relaxed shadow-sm">
        {message.content}
      </div>
      {message.reasoning && (
        <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 px-2">
          <Brain size={10} />
          <span className="italic">Reasoning: {message.reasoning}</span>
        </div>
      )}
    </div>
  </motion.div>
);

export default function App() {
  const [topic, setTopic] = useState('');
  const [debate, setDebate] = useState<DebateState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents/list');
        const data = await response.json();
        if (data.agents) {
          setAgentsList(data.agents);
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      }
    };
    fetchAgents();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [debate?.messages]);

  const startDebate = async () => {
    if (!topic) return;
    setLoading(true);
    setError(null);
    console.log('Starting debate on topic:', topic);
    try {
      const res = await fetch('/api/debate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, presetId: 'scientists' })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start debate');
      }
      const data = await res.json();
      setDebate(data);
    } catch (err: any) {
      console.error('Start Debate Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextRound = async () => {
    if (!debate || loading) return;
    setLoading(true);
    setError(null);
    console.log('Proceeding to next round. Current status:', debate.status);
    try {
      const res = await fetch('/api/debate/next', { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to proceed to next round');
      }
      const data = await res.json();
      setDebate(data);
    } catch (err: any) {
      console.error('Next Round Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetDebate = () => {
    setDebate(null);
    setTopic('');
  };

  const exportReport = () => {
    if (!debate) return;
    const report = `# Synapse Council Consensus Report\n\n` +
      `**Topic:** ${debate.topic}\n` +
      `**Final Round:** ${debate.round}\n\n` +
      `## Voting Results\n` +
      `- YES: ${debate.votingResults?.YES}\n` +
      `- NO: ${debate.votingResults?.NO}\n` +
      `- NEUTRAL: ${debate.votingResults?.NEUTRAL}\n\n` +
      `## Debate History\n` +
      debate.messages.map(m => `### ${m.agentName} (${m.stance})\n${m.content}\n\n*Reasoning: ${m.reasoning}*`).join('\n\n');
    
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consensus-report-${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-brand-black text-slate-300 font-sans selection:bg-brand-pink/30">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-pink rounded-lg flex items-center justify-center">
              <Heart className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">Synapse <span className="text-brand-pink">Council</span></h1>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <ShieldAlert size={12} className={debate?.moderatorId ? "text-brand-blue" : "text-slate-600"} />
              <span>Moderator: <span className="text-brand-blue">{debate ? debate.agents.find(a => a.id === debate.moderatorId)?.name : 'Active'}</span></span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <CheckCircle2 size={12} className={agentsList.length > 0 ? "text-brand-pink" : "text-amber-500"} />
              <span>Agents: <span className={agentsList.length > 0 ? "text-brand-pink" : "text-amber-500"}>{agentsList.length > 0 ? `${agentsList.length} Found` : 'Token Required'}</span></span>
            </div>
          </div>
          
          {debate && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-dark border border-slate-800 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-brand-pink animate-pulse" />
                Round {debate.round} - {debate.status.replace('_', ' ')}
              </div>
              <button 
                onClick={resetDebate}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!debate ? (
          <div className="max-w-2xl mx-auto mt-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">The Future of <span className="text-brand-pink italic">Consensus</span></h2>
              <p className="text-slate-400 text-lg">Simulate complex group dynamics with autonomous AI agents powered by DigitalOcean Gradient AI.</p>
            </motion.div>

            <div className="bg-brand-dark/40 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Debate Topic</label>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Should we colonize Mars within the next 10 years?"
                  className="w-full bg-black/50 border border-slate-700 rounded-2xl p-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink transition-all resize-none h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-2 text-brand-pink mb-2">
                    <Music size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Group Preset</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200">The Scientific Council</p>
                  <p className="text-[10px] text-slate-500 mt-1">5 specialized agents with distinct biases.</p>
                </div>
                <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-2 text-brand-blue mb-2">
                    <Brain size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Engine</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200">DO Gradient AI</p>
                  <p className="text-[10px] text-slate-500 mt-1">Agent Platform & Inference Hub</p>
                </div>
              </div>

              {agentsList.length > 0 && (
                <div className="mb-8">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Available DO Agents</label>
                  <div className="flex flex-wrap gap-2">
                    {agentsList.map(agent => (
                      <div key={agent.uuid} className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-[10px] text-slate-300 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                        {agent.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={startDebate}
                disabled={!topic || loading}
                className="w-full bg-brand-pink hover:bg-brand-pink/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-pink/20"
              >
                {loading ? <RefreshCcw className="animate-spin" /> : <Play size={20} />}
                Initialize Simulation
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8 h-[calc(100vh-10rem)]">
            {/* Sidebar: Agents */}
            <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Agents</h2>
                <span className="text-[10px] bg-brand-pink/10 text-brand-pink px-2 py-0.5 rounded-full border border-brand-pink/20">{debate.agents.length} Online</span>
              </div>
              {debate.agents.map(agent => (
                <AgentCard 
                  key={agent.id} 
                  agent={agent} 
                  isModerator={agent.id === debate.moderatorId} 
                />
              ))}
            </div>

            {/* Main: Debate Feed */}
            <div className="col-span-6 flex flex-col bg-brand-dark/20 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 bg-brand-dark/40">
                <h3 className="text-sm font-bold text-white mb-1">Topic: {debate.topic}</h3>
                <div className="flex items-center gap-4 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><MessageSquare size={10} /> {debate.messages.length} Messages</span>
                  <span className="flex items-center gap-1"><RefreshCcw size={10} /> Round {debate.round}</span>
                </div>
              </div>

              <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {debate.messages.map(msg => (
                    <MessageItem 
                      key={msg.id} 
                      message={msg} 
                      agent={debate.agents.find(a => a.id === msg.agentId)} 
                    />
                  ))}
                </AnimatePresence>
                
                {loading && (
                  <div className="flex gap-4 mb-6 opacity-50">
                    <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse" />
                    <div className="flex-grow">
                      <div className="h-4 w-32 bg-slate-800 rounded animate-pulse mb-2" />
                      <div className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-800 bg-brand-dark/40">
                {debate.status !== 'COMPLETED' ? (
                  <button 
                    onClick={nextRound}
                    disabled={loading}
                    className="w-full bg-brand-pink hover:bg-brand-pink/80 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCcw className="animate-spin" /> : <TrendingUp size={18} />}
                    {debate.status === 'IDLE' ? 'Start Debate' : 'Proceed to Next Round'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="text-center p-2 bg-brand-pink/10 border border-brand-pink/20 rounded-xl text-brand-pink text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} />
                      Simulation Complete
                    </div>
                    <button 
                      onClick={exportReport}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <Download size={18} />
                      Export Consensus Report (.md)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Stats & Voting */}
            <div className="col-span-3 flex flex-col gap-6">
              {/* Voting Results */}
              <div className="bg-brand-dark/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Vote size={14} /> Current Consensus
                </h3>
                
                {debate.votingResults ? (
                  <div className="space-y-4">
                    {Object.entries(debate.votingResults).map(([stance, count]) => {
                      const total = debate.agents.length;
                      const percentage = ((count as number) / total) * 100;
                      const colors = {
                        YES: 'bg-brand-pink',
                        NO: 'bg-brand-blue',
                        NEUTRAL: 'bg-slate-500'
                      };
                      return (
                        <div key={stance}>
                          <div className="flex justify-between text-[10px] font-bold mb-1 uppercase tracking-wider">
                            <span>{stance}</span>
                            <span>{count} / {total}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className={`${colors[stance as Stance]} h-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShieldAlert className="text-slate-600" size={20} />
                    </div>
                    <p className="text-[10px] text-slate-500">Voting results will appear after the argument rounds.</p>
                  </div>
                )}
              </div>

              {/* System Logs */}
              <div className="bg-brand-dark/50 border border-slate-800 rounded-2xl p-6 flex-grow overflow-hidden flex flex-col">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertCircle size={14} /> System Logs
                </h3>
                <div className="flex-grow overflow-y-auto text-[10px] font-mono text-slate-500 space-y-2 custom-scrollbar">
                  <p className="text-brand-pink/70">[{new Date().toLocaleTimeString()}] Initializing Gradient AI Inference Engine...</p>
                  <p className="text-brand-blue/70">[{new Date().toLocaleTimeString()}] Connection established with DigitalOcean Hub.</p>
                  {debate.messages.map((m, i) => (
                    <p key={i}>[{new Date(m.timestamp).toLocaleTimeString()}] Agent {m.agentName} processed round {m.round}.</p>
                  ))}
                  {loading && <p className="animate-pulse">[{new Date().toLocaleTimeString()}] Processing LLM inference...</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {error && (
        <div className="fixed bottom-6 right-6 bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <AlertCircle size={20} />
          <span className="text-sm font-bold">{error}</span>
          <button onClick={() => setError(null)} className="hover:bg-white/20 rounded-full p-1">
            <RefreshCcw size={14} />
          </button>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
