import numpy as np
from gymnasium import spaces
from pettingzoo.utils.env import AECEnv
from pettingzoo.utils.agent_selector import agent_selector
from pettingzoo.utils import wrappers

# --- Assumed location of your new modules ---
from ..db_connector import SupabaseConnector
from ..utils.governance import GovernanceModule

# --- Assumed content of a utils.py file in the same directory ---
def get_initial_agent_state():
    """Returns the default starting state for any agent."""
    return {
        "cash": 1000.0,
        "assets": 10,
        "reputation": 1.0,
        "tokens": 100,
    }
# ---------------------------------------------

def create_env():
    """Helper function to create and wrap the environment for RLlib."""
    env = DecentralizedEconomyEnv()
    env = wrappers.OrderEnforcingWrapper(env)
    return env


class DecentralizedEconomyEnv(AECEnv):
    """
    An AECEnv environment for a multi-agent decentralized economy simulation
    with an integrated and incentivized governance module.
    """
    metadata = {'render.modes': ['human'], "name": "decentralized_economy_v2"}

    def __init__(self, render_mode=None, max_steps=100):
        super().__init__()
        
        # Store configuration
        self.max_steps = max_steps
        self.render_mode = render_mode

        # Define agent roles
        self.possible_agents = ["trader_0", "trader_1", "validator_0", "rule_maker_0"]
        
        # Define action and observation spaces
        # 0: Hold, 1: Buy, 2: Sell, 3: Propose Rule, 4: Vote Yes, 5: Vote No, 6: Other
        self._action_spaces = {agent: spaces.Discrete(7) for agent in self.possible_agents}
        # Obs: [cash, assets, market_price, reputation, tokens, tax_rate]
        self._observation_spaces = {agent: spaces.Box(low=0, high=1e6, shape=(6,), dtype=np.float32) for agent in self.possible_agents}

        # Initialize the Governance Module
        self.governance = GovernanceModule(eligible_voters=self.possible_agents, vote_duration_steps=10)

        # Initialize the database connector
        try:
            self.db = SupabaseConnector()
        except ValueError as e:
            print(f"Database connection failed: {e}. Running without logging.")
            self.db = None
            
    def observation_space(self, agent):
        return self._observation_spaces[agent]

    def action_space(self, agent):
        return self._action_spaces[agent]

    def reset(self, seed=None, options=None):
        """Resets the environment to a starting state."""
        self.agents = self.possible_agents[:]
        self._agent_selector = agent_selector(self.agents)
        self.agent_selection = self._agent_selector.next()
        
        self.steps = 0
        self.market_price = 100.0
        self.tax_rate = 0.05
        
        self.agent_states = {agent: get_initial_agent_state() for agent in self.agents}
        self.rewards = {agent: 0 for agent in self.agents}
        self._cumulative_rewards = {agent: 0 for agent in self.agents}
        self.terminations = {agent: False for agent in self.agents}
        self.truncations = {agent: False for agent in self.agents}
        self.infos = {agent: {} for agent in self.agents}
        
        self.governance = GovernanceModule(eligible_voters=self.possible_agents, vote_duration_steps=10)

        observation = self.observe(self.agent_selection)
        return observation, self.infos[self.agent_selection]

    def observe(self, agent):
        """Returns the observation for the specified agent."""
        state = self.agent_states[agent]
        return np.array([
            state['cash'], state['assets'], self.market_price,
            state['reputation'], state['tokens'], self.tax_rate
        ], dtype=np.float32)

    def step(self, action):
        """Executes one step for the current agent."""
        if self.terminations[self.agent_selection] or self.truncations[self.agent_selection]:
            self._was_dead_step(action)
            return

        agent = self.agent_selection
        state_before = self.agent_states[agent].copy()
        net_worth_before = state_before['cash'] + (state_before['assets'] * self.market_price)

        # --- Action Consequences ---
        if action == 1:  # Buy
            if state_before["cash"] >= self.market_price:
                self.agent_states[agent]["cash"] -= self.market_price
                self.agent_states[agent]["assets"] += 1
                self.market_price *= 1.01
                self.agent_states[agent]["reputation"] += 0.01
        
        elif action == 2:  # Sell
            if state_before["assets"] > 0:
                earnings = self.market_price * (1 - self.tax_rate)
                self.agent_states[agent]["cash"] += earnings
                self.agent_states[agent]["assets"] -= 1
                self.market_price *= 0.99
                self.agent_states[agent]["reputation"] += 0.01

        elif action == 3: # Propose Rule
            proposed_tax = round(np.random.uniform(0.01, 0.2), 2)
            if self.governance.start_proposal(agent, "tax_rate", proposed_tax, self.steps):
                self.agent_states[agent]["reputation"] += 0.05

        elif action == 4: # Vote Yes
            if self.governance.cast_vote(agent, vote=True):
                self.agent_states[agent]["reputation"] += 0.02

        elif action == 5: # Vote No
            if self.governance.cast_vote(agent, vote=False):
                self.agent_states[agent]["reputation"] += 0.02

        # --- Reward Function (for the current agent) ---
        state_after = self.agent_states[agent]
        net_worth_after = state_after['cash'] + (state_after['assets'] * self.market_price)
        economic_reward = net_worth_after - net_worth_before
        reputation_change = state_after['reputation'] - state_before['reputation']
        reputation_reward = reputation_change * 10.0 # Weight reputation changes
        self.rewards[agent] = economic_reward + reputation_reward

        # --- Update Environment State & Distribute Governance Rewards (at the end of a full cycle) ---
        if self._agent_selector.is_last():
            self.steps += 1
            
            outcome = self.governance.tally_votes(self.steps)
            if outcome: # If voting has concluded
                # --- Apply Rule Changes ---
                if outcome == 'passed':
                    details = self.governance.proposal_details
                    if details['rule'] == 'tax_rate':
                        self.tax_rate = details['value']
                        print(f"✅ RULE CHANGE: Tax rate is now {self.tax_rate}")
                    # Reward the proposer for a successful proposal
                    proposer = details['proposer']
                    self.rewards[proposer] += 50.0 # Large reward for success
                    self.agent_states[proposer]['reputation'] += 0.25

                # --- Distribute Voting Rewards ---
                for voter, vote in self.governance.votes.items():
                    # Reward for voting with the majority
                    if (outcome == 'passed' and vote is True) or \
                       (outcome == 'failed' and vote is False):
                        self.rewards[voter] += 10.0 # Reward for consensus
                        self.agent_states[voter]['reputation'] += 0.1

                self.governance.end_voting_period() # Reset for the next vote
            
            if self.steps >= self.max_steps:
                self.truncations = {ag: True for ag in self.agents}
        
        self.agent_selection = self._agent_selector.next()
        self._accumulate_rewards()
        if self.render_mode == 'human':
            self.render()

    def render(self):
        """Renders the environment state."""
        if self.render_mode == 'human':
            print(f"\n--- Step {self.steps} | Market Price: ${self.market_price:.2f} | Tax Rate: {self.tax_rate:.2%} ---")
            if self.governance.is_vote_active:
                print(f"🏛️ VOTE ACTIVE: {self.governance.proposal_details}")
            for agent in self.possible_agents:
                state = self.agent_states[agent]
                print(f"{agent}: Cash: ${state['cash']:.2f}, Assets: {state['assets']}, Rep: {state['reputation']:.2f}, Last Reward: {self.rewards[agent]:.2f}")

    def close(self):
        pass