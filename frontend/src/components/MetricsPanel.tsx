import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TrendingUp, TrendingDown, Activity, Users, Vote, Award } from 'lucide-react';
import type { GovernanceMetrics } from '../types/governance';

// Helper component for individual metric cards (your design)
const MetricCard = ({
  title,
  value,
  unit,
  trend,
  icon: Icon,
  color
}: {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  icon: React.ElementType; // Use React.ElementType for component icons
  color: string;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {unit && <span className="text-sm text-slate-500">{unit}</span>}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
);

// Main component that fetches data and then renders the UI
export default function MetricsPanel() {
  // State to hold the metrics data, loading status, and any errors
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect runs once when the component is first mounted
  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        // Fetch data from the 'governance_metrics' table in Supabase
        const { data, error } = await supabase
          .from('agent_states')
          .select('*')
          .order('id', { ascending: false });

        if (error) console.error("Error fetching agent states:", error);


        if (error) throw error;
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  // Helper function to format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  // Conditional Rendering: Show loading or error states first
  if (loading) {
    return <div className="text-center p-8">Loading Governance Metrics...</div>;
  }
  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }
  
  // If data is successfully loaded, render your beautiful UI
  if (!metrics) {
      return <div className="text-center p-8">No metrics data found.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Governance Metrics</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Live
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Token Supply"
          value={formatNumber(metrics.total_token_supply)}
          icon={Activity}
          color="bg-blue-500"
          trend={2.3}
        />
        <MetricCard
          title="Transaction Volume"
          value={formatNumber(metrics.transaction_volume)}
          unit="24h"
          icon={TrendingUp}
          color="bg-emerald-500"
          trend={12.5}
        />
        <MetricCard
          title="Inflation Rate"
          value={metrics.inflation_rate}
          unit="%"
          icon={Activity}
          color="bg-orange-500"
          trend={-0.8}
        />
        <MetricCard
          title="Active Proposals"
          value={metrics.active_proposals}
          icon={Vote}
          color="bg-violet-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Agents"
          value={metrics.total_agents}
          icon={Users}
          color="bg-cyan-500"
        />
        <MetricCard
          title="Active Agents"
          value={metrics.active_agents}
          icon={Users}
          color="bg-teal-500"
          trend={5.2}
        />
        <MetricCard
          title="Avg Reputation"
          value={metrics.average_reputation.toFixed(1)}
          icon={Award}
          color="bg-amber-500"
          trend={3.1}
        />
        <MetricCard
          title="Participation Rate"
          value={metrics.governance_participation.toFixed(1)}
          unit="%"
          icon={Vote}
          color="bg-rose-500"
          trend={8.4}
        />
      </div>
    </div>
  );
}