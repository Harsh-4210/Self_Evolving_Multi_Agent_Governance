import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Play, Pause, RotateCcw, Settings, Zap } from 'lucide-react';
import type { SimulationParams } from '../types/governance';

export default function SimulationControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultParams: SimulationParams = {
    speed: 1,
    agent_count: 10,
    transaction_rate: 100,
    proposal_frequency: 5,
    conflict_probability: 15,
  };

  const [params, setParams] = useState<SimulationParams>({ ...defaultParams });

  const handleParamChange = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handlePlayPause = async () => {
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('simulation_runs').insert([params]);
      if (error) throw error;
      setIsRunning(true);
      alert('Simulation started successfully!');
    } catch (err: any) {
      alert(`Error starting simulation: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setParams({ ...defaultParams });
  };

  const scenarios: { name: string; icon: string; description: string }[] = [
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
              showSettings
                ? 'bg-blue-100 text-blue-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-3 mb-6">
        <button
          onClick={handlePlayPause}
          disabled={isSubmitting}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
            isRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {isSubmitting
            ? 'Starting...'
            : isRunning
            ? (<><Pause className="w-5 h-5" /> Pause Simulation</>)
            : (<><Play className="w-5 h-5" /> Start Simulation</>)
          }
        </button>
        <button
          onClick={handleReset}
          className="flex-1 md:flex-none px-6 py-3 rounded-lg font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-2 justify-center"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="font-semibold text-slate-900 mb-4">Simulation Parameters</h3>
          <div className="space-y-4">
            {Object.entries(params).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">{key.replace('_', ' ').toUpperCase()}</label>
                  <span className="text-sm font-semibold text-slate-900">{value}</span>
                </div>
                <input
                  type="range"
                  min={key === 'speed' ? 0.5 : 1}
                  max={key === 'speed' ? 5 : 100}
                  step={key === 'speed' ? 0.5 : 1}
                  value={value}
                  onChange={e => handleParamChange(key as keyof SimulationParams, parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            ))}
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
