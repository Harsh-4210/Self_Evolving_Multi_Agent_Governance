import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Proposal } from '../types/governance';
import { ThumbsUp, ThumbsDown, MinusCircle } from 'lucide-react';

export default function VotingInterface() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState<string | null>(null);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('governance_log')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      // Convert string numbers to actual numbers
      const normalized = (data || []).map(p => ({
        ...p,
        votes_for: Number(p.votes_for || 0),
        votes_against: Number(p.votes_against || 0),
        votes_abstain: Number(p.votes_abstain || 0),
        total_voting_power: Number(p.total_voting_power || 1), // avoid division by zero
        ends_at: p.ends_at ? new Date(p.ends_at) : new Date(), // convert string -> Date
      }));

      setProposals(normalized);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleVote = async (proposalId: string, voteType: 'for' | 'against' | 'abstain') => {
    setIsVoting(proposalId);
    try {
      const voteColumn = `votes_${voteType}`;
      const { error } = await supabase.rpc('increment_vote', {
        proposal_id_to_update: proposalId,
        vote_column: voteColumn,
      });

      if (error) throw error;

      fetchProposals();
    } catch (err: any) {
      alert(`Error casting vote: ${err.message}`);
    } finally {
      setIsVoting(null);
    }
  };

  const getTimeRemaining = (endsAt: Date) => {
    const now = new Date();
    const diff = endsAt.getTime() - now.getTime();
    if (diff < 0) return "Voting ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Ending soon';
  };

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
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{proposal.title}</h3>
                  <span className="text-xs text-slate-500">{getTimeRemaining(proposal.ends_at)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-700">
                  <div>For: {proposal.votes_for.toLocaleString()}</div>
                  <div>Against: {proposal.votes_against.toLocaleString()}</div>
                  <div>Abstain: {proposal.votes_abstain.toLocaleString()}</div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-slate-700 mb-4">Cast your vote on this proposal:</p>
                  <div className="flex gap-3">
                    <button
                      disabled={isVoting === proposal.id}
                      onClick={e => { e.stopPropagation(); handleVote(proposal.id, 'for'); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      <ThumbsUp className="w-4 h-4" /> {isVoting === proposal.id ? 'Voting...' : 'Vote For'}
                    </button>
                    <button
                      disabled={isVoting === proposal.id}
                      onClick={e => { e.stopPropagation(); handleVote(proposal.id, 'against'); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      <ThumbsDown className="w-4 h-4" /> {isVoting === proposal.id ? 'Voting...' : 'Vote Against'}
                    </button>
                    <button
                      disabled={isVoting === proposal.id}
                      onClick={e => { e.stopPropagation(); handleVote(proposal.id, 'abstain'); }}
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
