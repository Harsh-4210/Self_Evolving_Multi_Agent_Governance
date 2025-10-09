# backend/env/environment.py

import numpy as np
from gymnasium import spaces
from ray.rllib.env import MultiAgentEnv

# We'll need this for the governance features.
from backend.utils.governance import GovernanceModule

class DecentralizedEconomyEnv(MultiAgentEnv):
    """
    An upgraded MultiAgentEnv with a fully integrated governance and
    advanced reward system.
    """
    def __init__(self, env_config=None):
        super().__init__()
        env_config = env_config or {}
        self._num_agents = env_config.get("num_agents", 4)
        self.max_steps = env_config.get("max_steps", 100)

        # FIX #2: Use the correct variable name `self._num_agents`
        self.agents = [f"agent_{i}" for i in range(self._num_agents)]
        self._agent_ids = set(self.agents)

        ### FIX #1: Define spaces as dictionaries mapping agent_id to space ###
        single_action_space = spaces.Discrete(7)
        single_obs_space = spaces.Box(low=0, high=1e6, shape=(6,), dtype=np.float32)
        
        self.action_space = {agent_id: single_action_space for agent_id in self.agents}
        self.observation_space = {agent_id: single_obs_space for agent_id in self.agents}
        #####################################################################

        self.governance = GovernanceModule(eligible_voters=self.agents, vote_duration_steps=10)
        self.tax_rate = 0.05
        self.market_price = 100.0
        self.steps = 0
        self.agent_states = {}

    def reset(self, *, seed=None, options=None):
        """Resets the environment to a starting state."""
        self.steps = 0
        self.market_price = 100.0
        self.tax_rate = 0.05
        self.governance.end_voting_period()

        self.agent_states = {agent: self._get_initial_state() for agent in self.agents}

        obs = {agent: self._get_obs(agent) for agent in self.agents}
        infos = {agent: {} for agent in self.agents}
        return obs, infos

    def step(self, action_dict):
        """Processes a single, simultaneous step for all agents."""
        self.steps += 1
        obs, rewards, terminations, truncations, infos = {}, {}, {}, {}, {}

        states_before = {agent: state.copy() for agent, state in self.agent_states.items()}
        net_worths_before = {
            agent: state['cash'] + (state['assets'] * self.market_price)
            for agent, state in states_before.items()
        }

        # Process agent actions
        for agent, action in action_dict.items():
            state = self.agent_states[agent]
            if action == 1: # Buy
                if state["cash"] >= self.market_price:
                    state["cash"] -= self.market_price; state["assets"] += 1
                    self.market_price *= 1.01; state["reputation"] += 0.01
            elif action == 2: # Sell
                if state["assets"] > 0:
                    earnings = self.market_price * (1 - self.tax_rate)
                    state["cash"] += earnings; state["assets"] -= 1
                    self.market_price *= 0.99; state["reputation"] += 0.01
            elif action == 3: # Propose Rule
                proposed_tax = round(np.random.uniform(0.01, 0.2), 2)
                if self.governance.start_proposal(agent, "tax_rate", proposed_tax, self.steps):
                    state["reputation"] += 0.05
            elif action == 4: # Vote Yes
                if self.governance.cast_vote(agent, vote=True):
                    state["reputation"] += 0.02
            elif action == 5: # Vote No
                if self.governance.cast_vote(agent, vote=False):
                    state["reputation"] += 0.02
            self.agent_states[agent] = state

        # Calculate rewards
        for agent in self.agents:
            net_worth_after = self.agent_states[agent]['cash'] + (self.agent_states[agent]['assets'] * self.market_price)
            economic_reward = net_worth_after - net_worths_before[agent]
            reputation_change = self.agent_states[agent]['reputation'] - states_before[agent]['reputation']
            reputation_reward = reputation_change * 10.0
            rewards[agent] = economic_reward + reputation_reward

        # Tally votes and distribute governance rewards
        outcome = self.governance.tally_votes(self.steps)
        if outcome:
            if outcome == 'passed':
                details = self.governance.proposal_details
                if details['rule'] == 'tax_rate': self.tax_rate = details['value']
                proposer = details['proposer']
                rewards[proposer] = rewards.get(proposer, 0) + 50.0
                self.agent_states[proposer]['reputation'] += 0.25
            for voter, vote in self.governance.votes.items():
                if (outcome == 'passed' and vote is True) or (outcome == 'failed' and vote is False):
                    rewards[voter] = rewards.get(voter, 0) + 10.0
                    self.agent_states[voter]['reputation'] += 0.1
            self.governance.end_voting_period()

        # Set final values for the step
        done = self.steps >= self.max_steps
        for agent in self.agents:
            obs[agent] = self._get_obs(agent)
            infos[agent] = {}; terminations[agent] = done; truncations[agent] = done
        terminations["__all__"] = done; truncations["__all__"] = done

        return obs, rewards, terminations, truncations, infos

    def _get_obs(self, agent):
        """Returns the 6-element observation for an agent."""
        state = self.agent_states[agent]
        return np.array([
                state.get("cash", 0), state.get("assets", 0),
                state.get("tokens", 0), self.market_price,
                state.get("reputation", 0), self.tax_rate,
            ], dtype=np.float32)

    def _get_initial_state(self):
        """Returns the complete starting state for an agent."""
        return { "cash": 1000.0, "assets": 10, "tokens": 100, "reputation": 1.0 }