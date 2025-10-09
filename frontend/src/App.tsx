import MetricsPanel from './components/MetricsPanel';
import NetworkGraph from './components/NetworkGraph';
import RuleTimeline from './components/RuleTimeline';
import VotingInterface from './components/VotingInterface';
import ConflictPanel from './components/ConflictPanel';
import SimulationControl from './components/SimulationControl';
import { Network } from 'lucide-react';

function App() {
  // No more useState or useEffect for data here!

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
                Live Data Mode
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Each component now fetches its own data, so no props are passed down */}
          <MetricsPanel />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <NetworkGraph />
            <SimulationControl />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RuleTimeline />
            <VotingInterface />
          </div>

          <ConflictPanel />
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
