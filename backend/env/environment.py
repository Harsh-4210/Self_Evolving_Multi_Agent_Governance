import numpy as np
from gymnasium import spaces
from ray.rllib.env import MultiAgentEnv
from backend.utils.governance import GovernanceModule
from backend.env.utils import get_initial_agent_state, get_observation_space, get_action_space
from backend.db_connector import LocalDBConnector  # updated here

db_connector = LocalDBConnector()  # use LocalDBConnector instead of SupabaseConnector


class DecentralizedEconomyEnv(MultiAgentEnv):
    """
    Multi-agent economic environment with governance.
    Features:
    - Buy/Sell/Propose/Vote actions
    - Reputation and economic reward system
    - Local PostgreSQL logging for agent states, transactions, governance, and simulation runs
    - META-LEARNING: Randomized parameters for adaptable agent training
    """

    def __init__(self, env_config=None):
        super().__init__()
        env_config = env_config or {}
        self._num_agents = env_config.get("num_agents", 4)
        self.max_steps = env_config.get("max_steps", 100)
        self.agents = [f"agent_{i}" for i in range(self._num_agents)]

        # RLlib action and observation spaces
        single_action_space = get_action_space()
        single_obs_space = get_observation_space()
        self.action_space = {agent: single_action_space for agent in self.agents}
        self.observation_space = {agent: single_obs_space for agent in self.agents}

        # Governance system
        self.governance = GovernanceModule(eligible_voters=self.agents, vote_duration_steps=10)

        # Economic parameters
        self.tax_rate = 0.05
        self.market_price = 100.0
        
        # --- META-LEARNING ADDITION 1: Define parameter ranges for task distribution ---
        self.price_range = env_config.get("price_range", (75.0, 125.0))
        self.tax_range = env_config.get("tax_range", (0.02, 0.15))
        self.volatility_range = env_config.get("volatility_range", (1.005, 1.025))
        self.volatility_factor = 1.01 # Default, will be sampled in reset()
        # ----------------------------------------------------------------------------

        self.steps = 0
        self.agent_states = {}

        # Local PostgreSQL logging via LocalDBConnector
        self.db = db_connector  
        self.db.log_simulation_run(agent_count=self._num_agents)

    # ---------- Reset ----------
    def reset(self, *, seed=None, options=None):
        self.steps = 0
        self.governance.end_voting_period()

        # --- META-LEARNING ADDITION 2: Sample a new task for the episode ---
        self.market_price = np.random.uniform(*self.price_range)
        self.tax_rate = np.random.uniform(*self.tax_range)
        self.volatility_factor = np.random.uniform(*self.volatility_range)
        # -----------------------------------------------------------------

        self.agent_states = {
            agent: {**get_initial_agent_state(), "market_price": self.market_price} for agent in self.agents
        }

        # Log initial states
        for agent, state in self.agent_states.items():
            self.db.log_agent_state(agent, state)

        obs = {agent: self._get_obs(agent) for agent in self.agents}
        infos = {agent: {} for agent in self.agents}
        return obs, infos

    # ---------- Step ----------
    def step(self, action_dict):
        self.steps += 1
        obs, rewards, terminations, truncations, infos = {}, {}, {}, {}, {}

        states_before = {agent: state.copy() for agent, state in self.agent_states.items()}
        net_worths_before = {
            agent: state['cash'] + state['assets'] * self.market_price for agent, state in states_before.items()
        }

        # ---------- Process actions ----------
        for agent, action in action_dict.items():
            state = self.agent_states[agent]
            state["last_action"] = action

            if action == 1:  # Buy
                if state["cash"] >= self.market_price:
                    state["cash"] -= self.market_price
                    state["assets"] += 1
                    state["total_trades"] += 1
                    self.market_price *= self.volatility_factor
                    state["reputation"] += 0.01
                    self.db.log_transaction(agent, "buy", self.market_price)
            elif action == 2:  # Sell
                if state["assets"] > 0:
                    earnings = self.market_price * (1 - self.tax_rate)
                    state["cash"] += earnings
                    state["assets"] -= 1
                    state["total_trades"] += 1
                    self.market_price /= self.volatility_factor  # inverse for sell
                    state["reputation"] += 0.01
                    self.db.log_transaction(agent, "sell", self.market_price)
            elif action == 3:  # Propose Rule
                proposed_tax = round(np.random.uniform(0.01, 0.2), 2)
                if self.governance.start_proposal(agent, "tax_rate", proposed_tax, self.steps):
                    state["reputation"] += 0.05
                    self.db.log_governance_event("proposal", agent, self.governance.proposal_details)
            elif action == 4:  # Vote Yes
                if self.governance.cast_vote(agent, vote=True, weight=state.get("reputation", 1.0)):
                    state["reputation"] += 0.02
                    self.db.log_governance_event("vote_yes", agent, {"step": self.steps})
            elif action == 5:  # Vote No
                if self.governance.cast_vote(agent, vote=False, weight=state.get("reputation", 1.0)):
                    state["reputation"] += 0.02
                    self.db.log_governance_event("vote_no", agent, {"step": self.steps})

            self.agent_states[agent] = state

        # ---------- Rewards ----------
        for agent in self.agents:
            net_worth_after = self.agent_states[agent]['cash'] + self.agent_states[agent]['assets'] * self.market_price
            economic_reward = net_worth_after - net_worths_before[agent]
            reputation_reward = (self.agent_states[agent]['reputation'] - states_before[agent]['reputation']) * 10.0
            rewards[agent] = economic_reward + reputation_reward

        # ---------- Tally governance ----------
        outcome = self.governance.tally_votes(self.steps)
        if outcome:
            if outcome == 'passed':
                details = self.governance.proposal_details
                if details['rule'] == 'tax_rate':
                    self.tax_rate = details['value']
                proposer = details['proposer']
                rewards[proposer] += 50.0
                self.agent_states[proposer]['reputation'] += 0.25
            # Reward voters
            for voter, vote_info in self.governance.votes.items():
                vote = vote_info['vote']
                if (outcome == 'passed' and vote) or (outcome == 'failed' and not vote):
                    rewards[voter] += 10.0
                    self.agent_states[voter]['reputation'] += 0.1
            self.governance.end_voting_period()

        # ---------- Observations, done flags ----------
        done = self.steps >= self.max_steps
        for agent in self.agents:
            obs[agent] = self._get_obs(agent)
            infos[agent] = {}
            terminations[agent] = done
            truncations[agent] = done
            self.db.log_agent_state(agent, self.agent_states[agent])

        terminations["__all__"] = done
        truncations["__all__"] = done

        return obs, rewards, terminations, truncations, infos

    # ---------- Helper: Observations ----------
    def _get_obs(self, agent):
        state = self.agent_states[agent]
        return np.array([
            state.get("cash", 0),
            state.get("assets", 0),
            state.get("tokens", 0),
            self.market_price,
            state.get("reputation", 0),
            self.tax_rate
        ], dtype=np.float32)