import { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { AlertCircle, CheckCircle2, MessageSquare, ArrowUpCircle } from 'lucide-react';

interface Log {
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

interface Transaction {
  id: string;
  title: string;
  status: 'open' | 'negotiating' | 'resolved' | 'escalated' | string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  parties: string[];
  logs: Log[];
  outcome?: string;
  created_at: string;
  resolved_at?: string;
}

const placeholderData: Transaction[] = [
  {
    id: 'placeholder-1',
    title: 'Sample Conflict A',
    status: 'open',
    severity: 'medium',
    parties: ['Alice', 'Bob'],
    logs: [
      { actor: 'Alice', action: 'Proposed solution', details: 'Suggested compromise', timestamp: new Date().toISOString() },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'placeholder-2',
    title: 'Sample Conflict B',
    status: 'negotiating',
    severity: 'high',
    parties: ['Charlie', 'Dave'],
    logs: [],
    created_at: new Date().toISOString(),
  },
];

export default function ConflictPanel() {
  const [conflicts, setConflicts] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);

  useEffect(() => {
    const fetchConflicts = async () => {
      try {
        setLoading(true);
        const data = await api.getConflicts();

        const normalized = (data || []).map((item: any) => ({
          ...item,
          parties: item.parties ?? [],
          logs: item.logs ?? [],
          status: item.status ?? 'open',
          severity: item.severity ?? 'low',
        })) as Transaction[];

        setConflicts(normalized.length ? normalized : placeholderData);
      } catch (err: any) {
        console.error('API fetch error:', err);
        setError(err.message || 'Unable to fetch conflicts');
        setConflicts(placeholderData);
      } finally {
        setLoading(false);
      }
    };

    fetchConflicts();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchConflicts, 5000);
    return () => clearInterval(interval);
  }, []);

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
    const colors: Record<string, string> = {
      open: 'bg-amber-50 border-amber-200 text-amber-700',
      negotiating: 'bg-blue-50 border-blue-200 text-blue-700',
      resolved: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      escalated: 'bg-red-50 border-red-200 text-red-700',
    };
    return colors[status] ?? 'bg-slate-50 border-slate-200 text-slate-700';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-amber-100 text-amber-700',
      high: 'bg-amber-100 text-amber-700',
      critical: 'bg-red-100 text-red-700',
    };
    return colors[severity] ?? colors.low;
  };

  const formatTimestamp = (dateString: string | Date) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    const diff = new Date().getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) return <div className="p-6 text-center">Loading conflicts...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;

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
              className={`border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.01] animate-in fade-in slide-in-from-left-4 ${getStatusColor(conflict.status)}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-4 cursor-pointer" onClick={() => setSelectedConflict(isExpanded ? null : conflict.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">{getStatusIcon(conflict.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{conflict.title || 'Untitled Conflict'}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(conflict.severity)}`}>
                          {conflict.severity || 'low'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span>Parties:</span>
                        {conflict.parties.length > 0
                          ? conflict.parties.map((party, i) => (
                              <span key={i} className="px-2 py-1 bg-white rounded border border-slate-200 text-xs font-medium">{party}</span>
                            ))
                          : <span className="px-2 py-1 bg-white rounded border border-slate-200 text-xs font-medium text-slate-400">No parties</span>
                        }
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
                    {conflict.resolved_at && <p className="text-xs text-slate-500 mt-1">Resolved {formatTimestamp(conflict.resolved_at)}</p>}
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Negotiation Log
                  </h4>
                  <div className="space-y-3">
                    {conflict.logs.length > 0
                      ? conflict.logs.map((log, logIndex) => (
                          <div key={logIndex} className="flex gap-3 p-3 bg-slate-50 rounded-lg animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${logIndex * 50}ms` }}>
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
                        ))
                      : <p className="text-sm text-slate-500 italic">No logs available for this conflict.</p>
                    }
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <button className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm disabled:opacity-50" disabled={conflict.status === 'resolved'}>
                      Join Mediation
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}