import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Conflict } from '../types/governance';
import { AlertCircle, CheckCircle2, MessageSquare, ArrowUpCircle } from 'lucide-react';

// This component no longer needs to receive props
export default function ConflictPanel() {
  // State to hold the list of conflicts, loading status, and any errors
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to manage which conflict item is expanded in the UI
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);

  // useEffect runs once when the component is first mounted to fetch data
  useEffect(() => {
    async function fetchConflicts() {
      try {
        setLoading(true);
        // Fetch data from the 'conflicts' table in Supabase
        // Assumes you have a table named 'conflicts'
        const { data, error } = await supabase
          .from('conflicts')
          .select('*')
          .order('created_at', { ascending: false }); // Show newest conflicts first

        if (error) throw error;
        
        setConflicts(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchConflicts();
  }, []);

  // --- All of your original UI helper functions remain the same ---

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'negotiating': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'resolved': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'escalated': return <ArrowUpCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-amber-50 border-amber-200 text-amber-700',
      negotiating: 'bg-blue-50 border-blue-200 text-blue-700',
      resolved: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      escalated: 'bg-red-50 border-red-200 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-slate-50 border-slate-200 text-slate-700';
  };
  
  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-amber-100 text-amber-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };
  
  // IMPORTANT: Supabase sends dates as strings, so we must convert them to Date objects
  const formatTimestamp = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // --- Conditional Rendering for Loading and Error States ---
  if (loading) return <div className="p-6 text-center">Loading conflicts...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;

  // --- Render your original UI once data is loaded ---
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Conflict Resolution</h2>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
            {conflicts.filter(c => c.status === 'open' || c.status === 'negotiating').length} Active
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            {conflicts.filter(c => c.status === 'resolved').length} Resolved
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {conflicts.map((conflict, index) => {
          const isExpanded = selectedConflict === conflict.id;

          return (
            <div
              key={conflict.id}
              className={`border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-4 ${getStatusColor(conflict.status)}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setSelectedConflict(isExpanded ? null : conflict.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">{getStatusIcon(conflict.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{conflict.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(conflict.severity)}`}>
                          {conflict.severity}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span>Parties:</span>
                        {conflict.parties.map((party, i) => (
                          <span key={i} className="px-2 py-1 bg-white rounded border border-slate-200 text-xs font-medium">
                            {party}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(conflict.status)}`}>
                      {conflict.status}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{formatTimestamp(conflict.created_at)}</p>
                  </div>
                </div>

                {conflict.outcome && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-700 font-medium">Outcome: {conflict.outcome}</p>
                    {conflict.resolved_at && (
                      <p className="text-xs text-slate-500 mt-1">
                        Resolved {formatTimestamp(conflict.resolved_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 bg-white p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Negotiation Log
                  </h4>
                  <div className="space-y-3">
                    {conflict.logs.map((log, logIndex) => (
                      <div
                        key={logIndex}
                        className="flex gap-3 p-3 bg-slate-50 rounded-lg animate-in fade-in slide-in-from-left-2"
                        style={{ animationDelay: `${logIndex * 50}ms` }}
                      >
                        <div className="w-1 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-900 text-sm">{log.actor}</span>
                            <span className="text-xs text-slate-500">{formatTimestamp(log.timestamp)}</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">
                            <span className="font-medium text-slate-700">{log.action}</span>
                          </p>
                          <p className="text-xs text-slate-500">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {conflict.status !== 'resolved' && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <button className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200">
                        Join Mediation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}