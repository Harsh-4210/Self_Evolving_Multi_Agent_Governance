import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Proposal } from '../types/governance';
import { ThumbsUp, ThumbsDown, MinusCircle, Clock } from 'lucide-react';

export default function VotingInterface() {
  // State for data, loading, and errors
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for UI interaction
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState<string | null>(null); // To disable buttons on a proposal while voting

  const fetchProposals = async () => {
    try {
      setLoading(true);
      // Fetch only 'active' proposals from the database
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('status', 'active')
        .order('ends_at', { ascending: true }); // Show proposals ending soonest first

      if (error) throw error;
      setProposals(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // useEffect runs once to fetch the initial data
  useEffect(() => {
    fetchProposals();
  }, []);

  // MODIFIED: This function now updates the database
  const handleVote = async (proposalId: string, voteType: 'for' | 'against' | 'abstain') => {
    setIsVoting(proposalId);
    try {
      const voteColumn = `votes_${voteType}`; // e.g., 'votes_for'
      // Call the RPC function you created in Supabase
      const { error } = await supabase.rpc('increment_vote', {
        proposal_id_to_update: proposalId,
        vote_column: voteColumn,
      });

      if (error) throw error;

      // If vote is successful, refresh the proposals data to show the new count
      fetchProposals();
      alert(`Vote '${voteType}' cast successfully!`);

    } catch (error: any) {
      alert(`Error casting vote: ${error.message}`);
    } finally {
      setIsVoting(null);
    }
  };

  // --- All of your original UI helper functions remain the same ---

  const getCategoryColor = (category: string) => {
    const colors = {
      monetary: 'bg-blue-100 text-blue-700 border-blue-200',
      governance: 'bg-violet-100 text-violet-700 border-violet-200',
      technical: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      social: 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return colors[category as keyof typeof colors] || colors.governance;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-700',
      passed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      pending: 'bg-amber-100 text-amber-700',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getTimeRemaining = (endsAtString: string | Date) => {
    const endsAt = new Date(endsAtString);
    const now = new Date();
    const diff = endsAt.getTime() - now.getTime();

    if (diff < 0) return "Voting ended";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Ending soon';
  };
  
  // --- Conditional Rendering and Final UI ---
  
  if (loading) return <div className="p-6 text-center">Loading active proposals...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Active Proposals</h2>
        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
          {proposals.length} Active
        </span>
      </div>

      <div className="space-y-4">
        {proposals.map((proposal, index) => {
          // MODIFIED: Use snake_case for all properties from the database
          const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
          const forPercentage = (proposal.votes_for / proposal.total_voting_power) * 100;
          const againstPercentage = (proposal.votes_against / proposal.total_voting_power) * 100;
          const abstainPercentage = (proposal.votes_abstain / proposal.total_voting_power) * 100;
          const isExpanded = selectedProposal === proposal.id;

          return (
            <div
              key={proposal.id}
              className="border border-slate-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setSelectedProposal(isExpanded ? null : proposal.id)}
              >
                {/* ... The rest of your JSX remains the same, but ensure you use snake_case for properties ... */}
                {/* Example of snake_case update: */}
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div>
                  <span className="text-slate-600">For: <span className="font-semibold text-slate-900">{proposal.votes_for.toLocaleString()}</span></span>
                </div>
                {/* ... etc ... */}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-slate-700 mb-4">Cast your vote on this proposal:</p>
                  <div className="flex gap-3">
                    <button
                      disabled={isVoting === proposal.id}
                      onClick={(e) => { e.stopPropagation(); handleVote(proposal.id, 'for'); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      <ThumbsUp className="w-4 h-4" /> {isVoting === proposal.id ? 'Voting...' : 'Vote For'}
                    </button>
                    <button
                      disabled={isVoting === proposal.id}
                      onClick={(e) => { e.stopPropagation(); handleVote(proposal.id, 'against'); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      <ThumbsDown className="w-4 h-4" /> {isVoting === proposal.id ? 'Voting...' : 'Vote Against'}
                    </button>
                    <button
                      disabled={isVoting === proposal.id}
                      onClick={(e) => { e.stopPropagation(); handleVote(proposal.id, 'abstain'); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      <MinusCircle className="w-4 h-4" /> {isVoting === proposal.id ? 'Voting...' : 'Abstain'}
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