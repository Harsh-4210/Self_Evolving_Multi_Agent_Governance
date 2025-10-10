const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
  // Conflicts (Transactions)
  getConflicts: async () => {
    const response = await fetch(`${API_BASE_URL}/conflicts`);
    if (!response.ok) throw new Error('Failed to fetch conflicts');
    return response.json();
  },

  // Metrics (Agent States)
  getMetrics: async () => {
    const response = await fetch(`${API_BASE_URL}/metrics`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  },

  // Agents (Network Graph)
  getAgents: async () => {
    const response = await fetch(`${API_BASE_URL}/agents`);
    if (!response.ok) throw new Error('Failed to fetch agents');
    return response.json();
  },

  // Rules (Governance Log)
  getRules: async () => {
    const response = await fetch(`${API_BASE_URL}/rules`);
    if (!response.ok) throw new Error('Failed to fetch rules');
    return response.json();
  },

  // Proposals (Governance Log - Voting)
  getProposals: async () => {
    const response = await fetch(`${API_BASE_URL}/proposals`);
    if (!response.ok) throw new Error('Failed to fetch proposals');
    return response.json();
  },

  // Vote
  castVote: async (proposalId: string, voteType: 'for' | 'against' | 'abstain') => {
    const response = await fetch(`${API_BASE_URL}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId, voteType }),
    });
    if (!response.ok) throw new Error('Failed to cast vote');
    return response.json();
  },

  // Simulation
  startSimulation: async (params: any) => {
    const response = await fetch(`${API_BASE_URL}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to start simulation');
    return response.json();
  },
};