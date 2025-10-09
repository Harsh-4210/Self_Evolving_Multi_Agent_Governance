import React, { lazy, Suspense } from 'react';
import MetricsPanel from './components/MetricsPanel';
import RuleTimeline from './components/RuleTimeline';
import VotingInterface from './components/VotingInterface';
import ConflictPanel from './components/ConflictPanel';
import { Network } from 'lucide-react';
import type { ReactNode } from 'react';

// Lazy load heavy components
const NetworkGraph = lazy(() => import('./components/NetworkGraph'));
const SimulationControl = lazy(() => import('./components/SimulationControl'));

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("Error Boundary Caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
          Something went wrong. Please refresh.
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 transition-colors duration-500">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Decentralized Governance System</h1>
              <p className="text-sm text-slate-600">Multi-Agent Digital Economy Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
        <ErrorBoundary>
          <MetricsPanel />
        </ErrorBoundary>

        {/* Network & Simulation Control */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="p-6 bg-slate-100 rounded-lg animate-pulse text-center">
                Loading Network Graph...
              </div>
            }>
              <NetworkGraph />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary>
            <Suspense fallback={
              <div className="p-6 bg-slate-100 rounded-lg animate-pulse text-center">
                Loading Simulation Control...
              </div>
            }>
              <SimulationControl />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Rule Timeline & Voting Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ErrorBoundary>
            <RuleTimeline />
          </ErrorBoundary>
          <ErrorBoundary>
            <VotingInterface />
          </ErrorBoundary>
        </div>

        {/* Conflict Panel */}
        <ErrorBoundary>
          <ConflictPanel />
        </ErrorBoundary>
      </main>

      {/* Footer */}
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
