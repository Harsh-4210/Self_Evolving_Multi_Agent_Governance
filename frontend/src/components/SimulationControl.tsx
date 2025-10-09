import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Play, Pause, RotateCcw, Settings, Zap } from 'lucide-react';
import type { SimulationParams } from '../types/governance';

// The onParamsChange prop is likely no longer needed if this component manages the simulation start
export default function SimulationControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // To disable button while saving
  const [params, setParams] = useState<SimulationParams>({
    speed: 1,
    agent_count: 10,
    transaction_rate: 100,
    proposal_frequency: 5,
    conflict_probability: 15,
  });

  const handleParamChange = (key: keyof SimulationParams, value: number) => {
    setParams(prevParams => ({ ...prevParams, [key]: value }));
  };

  // MODIFIED: This function now saves the simulation run to the database
  const handlePlayPause = async () => {
    if (isRunning) {
      // Logic to pause a running simulation would be more complex (e.g., updating the run's status)
      // For now, we'll just toggle the UI state.
      setIsRunning(false);
    } else {
      setIsSubmitting(true);
      try {
        // Insert a new row into the 'simulation_runs' table with the current parameters
        const { data, error } = await supabase
          .from('simulation_runs')
          .insert([{
            speed: params.speed,
            agent_count: params.agent_count,
            transaction_rate: params.transaction_rate,
            proposal_frequency: params.proposal_frequency,
            conflict_probability: params.conflict_probability,
          }]);

if (error) console.error("Insert error:", error);


        if (error) throw error;
        
        // If successful, update the UI to show it's "running"
        setIsRunning(true);
        alert('New simulation run started successfully!');

      } catch (error: any) {
        alert(`Error starting simulation: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setParams({
      speed: 1,
      agent_count: 10,
      transaction_rate: 100,
      proposal_frequency: 5,
      conflict_probability: 15,
    });
  };

  const scenarios = [
    { name: 'High Activity', icon: '⚡', description: 'Maximum transaction volume' },
    { name: 'Governance Crisis', icon: '🔥', description: 'Multiple conflicts, low participation' },
    { name: 'Stable Growth', icon: '📈', description: 'Balanced parameters' },
    { name: 'Stress Test', icon: '💪', description: 'Extreme conditions' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Simulation Control</h2>
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Running
            </span>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handlePlayPause}
          disabled={isSubmitting} // Disable button while the request is in flight
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {isSubmitting ? 'Starting...' : isRunning ? (
            <><Pause className="w-5 h-5" /> Pause Simulation</>
          ) : (
            <><Play className="w-5 h-5" /> Start Simulation</>
          )}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-3 rounded-lg font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="font-semibold text-slate-900 mb-4">Simulation Parameters</h3>
          <div className="space-y-4">
             {/* All your slider inputs remain the same. This is just a snippet. */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Simulation Speed</label>
                <span className="text-sm font-semibold text-slate-900">{params.speed}x</span>
              </div>
              <input
                type="range" min="0.5" max="5" step="0.5" value={params.speed}
                onChange={(e) => handleParamChange('speed', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
             {/* ...other sliders go here... */}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Quick Scenarios
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {scenarios.map((scenario, index) => (
            <button
              key={index}
              className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{scenario.icon}</span>
                <span className="font-semibold text-slate-900 text-sm">{scenario.name}</span>
              </div>
              <p className="text-xs text-slate-600">{scenario.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}