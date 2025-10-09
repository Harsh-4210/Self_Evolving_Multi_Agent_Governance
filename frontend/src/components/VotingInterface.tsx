import { useState } from 'react';
import { type Proposal } from '../types/governance';
import { ThumbsUp, ThumbsDown, MinusCircle, Clock } from 'lucide-react';

interface VotingInterfaceProps {
  proposals: Proposal[];
}

export default function VotingInterface({ proposals }: VotingInterfaceProps) {
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);

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

  const getTimeRemaining = (endsAt: Date) => {
    const now = new Date();
    const diff = endsAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Ending soon';
  };

  const handleVote = (proposalId: string, voteType: 'for' | 'against' | 'abstain') => {
    console.log(`Voted ${voteType} on proposal ${proposalId}`);
  };

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
          const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
          const forPercentage = (proposal.votesFor / proposal.totalVotingPower) * 100;
          const againstPercentage = (proposal.votesAgainst / proposal.totalVotingPower) * 100;
          const abstainPercentage = (proposal.votesAbstain / proposal.totalVotingPower) * 100;
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">{proposal.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(proposal.category)}`}>
                        {proposal.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{proposal.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Proposed by {proposal.proposer}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(proposal.endsAt)}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                    {proposal.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Voting Progress</span>
                    <span className="font-medium text-slate-900">
                      {((totalVotes / proposal.totalVotingPower) * 100).toFixed(1)}% participation
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-500 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${forPercentage}%` }}
                    >
                      {forPercentage > 10 && `${forPercentage.toFixed(0)}%`}
                    </div>
                    <div
                      className="bg-red-500 transition-all duration-500 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${againstPercentage}%` }}
                    >
                      {againstPercentage > 10 && `${againstPercentage.toFixed(0)}%`}
                    </div>
                    <div
                      className="bg-slate-400 transition-all duration-500 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${abstainPercentage}%` }}
                    >
                      {abstainPercentage > 10 && `${abstainPercentage.toFixed(0)}%`}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-emerald-500"></div>
                      <span className="text-slate-600">For: <span className="font-semibold text-slate-900">{proposal.votesFor.toLocaleString()}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-red-500"></div>
                      <span className="text-slate-600">Against: <span className="font-semibold text-slate-900">{proposal.votesAgainst.toLocaleString()}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-slate-400"></div>
                      <span className="text-slate-600">Abstain: <span className="font-semibold text-slate-900">{proposal.votesAbstain.toLocaleString()}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-slate-700 mb-4">Cast your vote on this proposal:</p>
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(proposal.id, 'for');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Vote For
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(proposal.id, 'against');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Vote Against
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(proposal.id, 'abstain');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      <MinusCircle className="w-4 h-4" />
                      Abstain
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
