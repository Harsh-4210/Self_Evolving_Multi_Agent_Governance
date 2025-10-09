import { useState } from 'react';
import { Play, Pause, RotateCcw, Settings, Zap } from 'lucide-react';
import { type SimulationParams } from '../types/governance';

interface SimulationControlProps {
  onParamsChange?: (params: SimulationParams) => void;
}

export default function SimulationControl({ onParamsChange }: SimulationControlProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [params, setParams] = useState<SimulationParams>({
    speed: 1,
    agentCount: 10,
    transactionRate: 100,
    proposalFrequency: 5,
    conflictProbability: 15,
  });

  const handleParamChange = (key: keyof SimulationParams, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange?.(newParams);
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setParams({
      speed: 1,
      agentCount: 10,
      transactionRate: 100,
      proposalFrequency: 5,
      conflictProbability: 15,
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
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pause Simulation
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Simulation
            </>
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Simulation Speed</label>
                <span className="text-sm font-semibold text-slate-900">{params.speed}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={params.speed}
                onChange={(e) => handleParamChange('speed', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0.5x</span>
                <span>5x</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Agent Count</label>
                <span className="text-sm font-semibold text-slate-900">{params.agentCount}</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={params.agentCount}
                onChange={(e) => handleParamChange('agentCount', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5</span>
                <span>50</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Transaction Rate</label>
                <span className="text-sm font-semibold text-slate-900">{params.transactionRate}/min</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={params.transactionRate}
                onChange={(e) => handleParamChange('transactionRate', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>10/min</span>
                <span>500/min</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Proposal Frequency</label>
                <span className="text-sm font-semibold text-slate-900">{params.proposalFrequency}/day</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={params.proposalFrequency}
                onChange={(e) => handleParamChange('proposalFrequency', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1/day</span>
                <span>20/day</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Conflict Probability</label>
                <span className="text-sm font-semibold text-slate-900">{params.conflictProbability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={params.conflictProbability}
                onChange={(e) => handleParamChange('conflictProbability', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0%</span>
                <span>50%</span>
              </div>
            </div>
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
