import { useState, useEffect } from 'react';
import MetricsPanel from './components/MetricsPanel';
import NetworkGraph from './components/NetworkGraph';
import RuleTimeline from './components/RuleTimeline';
import VotingInterface from './components/VotingInterface';
import ConflictPanel from './components/ConflictPanel';
import SimulationControl from './components/SimulationControl';
import { mockAgents, mockProposals, mockRuleChanges, mockConflicts, mockMetrics } from './data/mockData';
import { type GovernanceMetrics, type SimulationParams } from './types/governance';
import { Network } from 'lucide-react';

function App() {
  const [metrics, setMetrics] = useState<GovernanceMetrics>(mockMetrics);
  const [, setSimulationParams] = useState<SimulationParams>({
    speed: 1,
    agentCount: 10,
    transactionRate: 100,
    proposalFrequency: 5,
    conflictProbability: 15,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        transactionVolume: prev.transactionVolume + Math.floor(Math.random() * 100),
        governanceParticipation: Math.min(100, prev.governanceParticipation + (Math.random() - 0.5) * 2),
        averageReputation: Math.max(0, Math.min(100, prev.averageReputation + (Math.random() - 0.5))),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Decentralized Governance System</h1>
                <p className="text-sm text-slate-600">Multi-Agent Digital Economy Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium shadow-sm">
                Demo Mode
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="space-y-6">
          <MetricsPanel metrics={metrics} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <NetworkGraph agents={mockAgents} />
            <SimulationControl onParamsChange={setSimulationParams} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RuleTimeline ruleChanges={mockRuleChanges} />
            <VotingInterface proposals={mockProposals} />
          </div>

          <ConflictPanel conflicts={mockConflicts} />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <p className="text-center text-sm text-slate-500">
            Decentralized Multi-Agent Governance System - Hackathon Demo
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
