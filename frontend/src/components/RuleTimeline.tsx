import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';

// TypeScript type matching Supabase response
export interface RuleChange {
  id: string;
  title?: string;
  description?: string;
  type?: 'enacted' | 'rejected' | 'voting' | 'proposed' | string;
  impact?: 'high' | 'medium' | 'low' | string;
  timestamp: string; // Keep as string from Supabase
  votes?: {
    for: number;
    against: number;
  };
}

export default function RuleTimeline() {
  const [ruleChanges, setRuleChanges] = useState<RuleChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRuleChanges() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('governance_log')
          .select('*')
          .order('id', { ascending: false });

        if (error) throw error;

        // Provide placeholder sample data if no data is returned
        const normalized: RuleChange[] = (data && data.length ? data : [
          {
            id: 'sample1',
            title: 'New Proposal Introduced',
            description: 'A new governance proposal has been added.',
            type: 'proposed',
            impact: 'medium',
            timestamp: new Date().toISOString(),
            votes: { for: 0, against: 0 },
          },
          {
            id: 'sample2',
            title: 'Voting Started',
            description: 'Voting has begun for the new proposal.',
            type: 'voting',
            impact: 'high',
            timestamp: new Date().toISOString(),
            votes: { for: 5, against: 2 },
          },
        ]) as RuleChange[];

        setRuleChanges(normalized);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchRuleChanges();
  }, []);

  // Helper functions
  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'enacted': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'voting': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'proposed': return <TrendingUp className="w-5 h-5 text-amber-600" />;
      default: return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'enacted': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'rejected': return 'bg-red-50 border-red-200 text-red-700';
      case 'voting': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'proposed': return 'bg-amber-50 border-amber-200 text-amber-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getImpactBadge = (impact?: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-blue-100 text-blue-700',
    };
    return colors[impact as keyof typeof colors] || colors.low;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  if (loading) return <div className="p-6 text-center">Loading timeline...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  if (!ruleChanges || ruleChanges.length === 0) return <div className="p-6 text-center">No rule changes found.</div>;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Rule Evolution Timeline</h2>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>
        <div className="space-y-6">
          {ruleChanges.map((change, index) => (
            <div
              key={change.id}
              className="relative pl-14 animate-in fade-in slide-in-from-left-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute left-3 top-2 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm">
                {getTypeIcon(change.type)}
              </div>
              <div className={`rounded-lg border p-4 transition-all duration-300 hover:shadow-md ${getTypeColor(change.type)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{change.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getImpactBadge(change.impact)}`}>
                        {change.impact || 'low'} impact
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{change.description}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                    {formatDate(change.timestamp)}
                  </span>
                </div>
                {change.votes && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-700">
                          For: <span className="font-semibold">{change.votes.for.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-slate-700">
                          Against: <span className="font-semibold">{change.votes.against.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(change.votes.for / (change.votes.for + change.votes.against)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
