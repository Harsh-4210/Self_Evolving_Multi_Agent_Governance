import { useState, useEffect, useRef } from 'react';
import { type Agent } from '../types/governance';
import { X } from 'lucide-react';

interface NetworkGraphProps {
  agents: Agent[];
}

export default function NetworkGraph({ agents }: NetworkGraphProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const radius = 180;
    const centerX = 300;
    const centerY = 250;
    const newPositions = new Map<string, { x: number; y: number }>();

    agents.forEach((agent, index) => {
      const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      newPositions.set(agent.id, { x, y });
    });

    setPositions(newPositions);
  }, [agents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    agents.forEach(agent => {
      const pos = positions.get(agent.id);
      if (!pos) return;

      agent.connections.forEach(targetId => {
        const targetPos = positions.get(targetId);
        if (!targetPos) return;

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });

    agents.forEach(agent => {
      const pos = positions.get(agent.id);
      if (!pos) return;

      const reputationRatio = agent.reputation / 100;
      const size = 8 + reputationRatio * 8;

      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size);

      if (agent.status === 'active') {
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#059669');
      } else if (agent.status === 'inactive') {
        gradient.addColorStop(0, '#94a3b8');
        gradient.addColorStop(1, '#64748b');
      } else {
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(1, '#dc2626');
      }

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      if (selectedAgent?.id === agent.id) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, 2 * Math.PI);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [agents, positions, selectedAgent]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundAgent: Agent | null = null;

    agents.forEach(agent => {
      const pos = positions.get(agent.id);
      if (!pos) return;

      const reputationRatio = agent.reputation / 100;
      const size = 8 + reputationRatio * 8;
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

      if (distance <= size) {
        foundAgent = agent;
      }
    });

    setSelectedAgent(foundAgent);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-900">Agent Network</h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-600">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span className="text-slate-600">Inactive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-600">Suspended</span>
          </div>
        </div>
      </div>

      <div className="relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={600}
          height={500}
          className="w-full cursor-pointer bg-slate-50 rounded-lg"
          onClick={handleCanvasClick}
        />

        {selectedAgent && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-slate-200 p-4 w-64 animate-in fade-in duration-200">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-lg">{selectedAgent.name}</h3>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Role:</span>
                <span className="font-medium text-slate-900">{selectedAgent.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className={`font-medium capitalize ${
                  selectedAgent.status === 'active' ? 'text-emerald-600' :
                  selectedAgent.status === 'inactive' ? 'text-slate-600' :
                  'text-red-600'
                }`}>
                  {selectedAgent.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Reputation:</span>
                <span className="font-medium text-slate-900">{selectedAgent.reputation}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${selectedAgent.reputation}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-slate-600">Voting Power:</span>
                <span className="font-medium text-slate-900">{selectedAgent.votingPower.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Connections:</span>
                <span className="font-medium text-slate-900">{selectedAgent.connections.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
