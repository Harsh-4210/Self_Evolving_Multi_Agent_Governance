import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { Agent } from '../types/governance';
import { X } from 'lucide-react';

export default function NetworkGraph() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch agents
  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('transactions').select('*');

        if (error) throw error;

        // Normalize data
        const normalized: Agent[] = (data || []).map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          name: item.name || 'Unknown',
          role: item.role || 'Member',
          status: item.status || 'inactive',
          reputation: Number(item.reputation) || 0,
          voting_power: Number(item.voting_power) || 0,
          connections: Array.isArray(item.connections) ? item.connections : [],
        }));

        setAgents(normalized);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAgents();
  }, []);

  // Calculate positions
  useEffect(() => {
    if (agents.length === 0) return;

    const radius = 180;
    const centerX = 300;
    const centerY = 250;
    const newPositions = new Map<string, { x: number; y: number }>();

    agents.forEach((agent, index) => {
      const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (Number.isFinite(x) && Number.isFinite(y)) {
        newPositions.set(agent.id, { x, y });
      }
    });

    setPositions(newPositions);
  }, [agents]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || positions.size === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    agents.forEach(agent => {
      const pos = positions.get(agent.id);
      if (!pos || !agent.connections) return;

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

    // Draw agents
    agents.forEach(agent => {
      const pos = positions.get(agent.id);
      if (!pos) return;

      const reputationRatio = Number(agent.reputation) || 0;
      const size = 8 + reputationRatio * 8;
      if (!Number.isFinite(size)) return;

      const x = pos.x;
      const y = pos.y;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
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
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      if (selectedAgent?.id === agent.id) {
        ctx.beginPath();
        ctx.arc(x, y, size + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [agents, positions, selectedAgent]);

  // Canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundAgent: Agent | null = null;

    for (let i = agents.length - 1; i >= 0; i--) {
      const agent = agents[i];
      const pos = positions.get(agent.id);
      if (!pos) continue;

      const reputationRatio = Number(agent.reputation) || 0;
      const size = 8 + reputationRatio * 8;
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

      if (distance <= size) {
        foundAgent = agent;
        break;
      }
    }

    setSelectedAgent(foundAgent);
  };

  if (loading) return <div className="p-6 text-center">Loading Agent Network...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-900">Agent Network</h2>
      </div>

      <div className="relative">
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
              <button onClick={() => setSelectedAgent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Role:</span><span className="font-medium text-slate-900">{selectedAgent.role}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Status:</span>
                <span className={`font-medium capitalize ${
                  selectedAgent.status === 'active' ? 'text-emerald-600' :
                  selectedAgent.status === 'inactive' ? 'text-slate-600' :
                  'text-red-600'
                }`}>{selectedAgent.status}</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-600">Reputation:</span><span className="font-medium text-slate-900">{selectedAgent.reputation}/100</span></div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${selectedAgent.reputation}%` }}></div>
              </div>
              <div className="flex justify-between mt-3"><span className="text-slate-600">Voting Power:</span><span className="font-medium text-slate-900">{selectedAgent.voting_power.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Connections:</span><span className="font-medium text-slate-900">{selectedAgent.connections.length}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
