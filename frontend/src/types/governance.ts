export interface Agent {
  id: string;
  name: string;
  reputation: number;
  voting_power: number; // camelCase to snake_case
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
  votes_for: number; // camelCase to snake_case
  votes_against: number; // camelCase to snake_case
  votes_abstain: number; // camelCase to snake_case
  total_voting_power: number; // camelCase to snake_case
  created_at: Date; // camelCase to snake_case
  ends_at: Date; // camelCase to snake_case
  category: 'monetary' | 'governance' | 'technical' | 'social';
}

export interface RuleChange {
  id: string;
  proposal_id: string; // camelCase to snake_case
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
  created_at: Date; // camelCase to snake_case
  resolved_at?: Date; // camelCase to snake_case
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
  total_token_supply: number; // camelCase to snake_case
  transaction_volume: number; // camelCase to snake_case
  inflation_rate: number; // camelCase to snake_case
  active_proposals: number; // camelCase to snake_case
  total_agents: number; // camelCase to snake_case
  active_agents: number; // camelCase to snake_case
  average_reputation: number; // camelCase to snake_case
  governance_participation: number; // camelCase to snake_case
}

export interface SimulationParams {
  speed: number;
  agent_count: number; // camelCase to snake_case
  transaction_rate: number; // camelCase to snake_case
  proposal_frequency: number; // camelCase to snake_case
  conflict_probability: number; // camelCase to snake_case
}