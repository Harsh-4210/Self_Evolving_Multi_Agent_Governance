export interface Agent {
  id: string;
  name: string;
  reputation: number;
  votingPower: number;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  connections: string[];
  position?: { x: number; y: number };
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotingPower: number;
  createdAt: Date;
  endsAt: Date;
  category: 'monetary' | 'governance' | 'technical' | 'social';
}

export interface RuleChange {
  id: string;
  proposalId: string;
  title: string;
  description: string;
  type: 'proposed' | 'voting' | 'enacted' | 'rejected';
  timestamp: Date;
  votes?: { for: number; against: number };
  impact: 'low' | 'medium' | 'high';
}

export interface Conflict {
  id: string;
  title: string;
  parties: string[];
  status: 'open' | 'negotiating' | 'resolved' | 'escalated';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  resolvedAt?: Date;
  outcome?: string;
  logs: ConflictLog[];
}

export interface ConflictLog {
  timestamp: Date;
  actor: string;
  action: string;
  details: string;
}

export interface GovernanceMetrics {
  totalTokenSupply: number;
  transactionVolume: number;
  inflationRate: number;
  activeProposals: number;
  totalAgents: number;
  activeAgents: number;
  averageReputation: number;
  governanceParticipation: number;
}

export interface SimulationParams {
  speed: number;
  agentCount: number;
  transactionRate: number;
  proposalFrequency: number;
  conflictProbability: number;
}
