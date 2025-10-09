# backend/env/environment.py

import numpy as np
from gymnasium import spaces
from pettingzoo.utils.env import AECEnv
from pettingzoo.utils.agent_selector import agent_selector

# --- Assumed content of your utils.py file ---
# Make sure you have a utils.py file in this same directory (backend/env/)
# with a function like this:
def get_initial_agent_state():
    """Returns the default starting state for any agent."""
    return {
        "cash": 1000.0,
        "assets": 10,
        "reputation": 1.0,
        "tokens": 100,
    }
# ---------------------------------------------

# Assuming db_connector.py is in the parent `backend` directory
from ..db_connector import SupabaseConnector


class DecentralizedEconomyEnv(AECEnv):
    """
    An AECEnv environment for a multi-agent decentralized economy simulation.
    Agents can trade assets, affecting a global market price, and participate
    in governance.
    """
    metadata = {'render.modes': ['human'], "name": "decentralized_economy_v0"}

    def __init__(self, render_mode=None, max_steps=100):
        super().__init__()
        
        # Store configuration
        self.max_steps = max_steps
        self.render_mode = render_mode

        # Define agent roles
        self.possible_agents = ["trader_0", "trader_1", "validator_0", "rule_maker_0"]
        self.agent_name_mapping = {agent: i for i, agent in enumerate(self.possible_agents)}

        # Define action and observation spaces for each agent
        # 0: Hold, 1: Buy, 2: Sell, 3: Propose Rule, 4: Vote Yes, 5: Vote No, 6: Other
        self._action_spaces = {agent: spaces.Discrete(7) for agent in self.possible_agents}
        # Obs: [cash, assets, market_price, reputation, tokens]
        self._observation_spaces = {agent: spaces.Box(low=0, high=1e6, shape=(5,), dtype=np.float32) for agent in self.possible_agents}

        # Initialize the database connector
        try:
            self.db = SupabaseConnector()
        except ValueError as e:
            print(f"Database connection failed: {e}")
            print("Running simulation without database logging.")
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
        
        # Reset environment state
        self.steps = 0
        self.market_price = 100.0
        
        # Reset agent-specific states
        self.agent_states = {agent: get_initial_agent_state() for agent in self.agents}
        self.rewards = {agent: 0 for agent in self.agents}
        self._cumulative_rewards = {agent: 0 for agent in self.agents}
        self.terminations = {agent: False for agent in self.agents}
        self.truncations = {agent: False for agent in self.agents}
        self.infos = {agent: {} for agent in self.agents}

        # Return initial observation and info for the first agent
        observation = self.observe(self.agent_selection)
        info = self.infos[self.agent_selection]
        return observation, info

    def observe(self, agent):
        """Returns the observation for the specified agent."""
        state = self.agent_states[agent]
        
        # Construct the 5-element observation vector
        return np.array([
            state.get('cash', 0),
            state.get('assets', 0),
            self.market_price,
            state.get('reputation', 1.0),
            state.get('tokens', 0)
        ], dtype=np.float32)

    def step(self, action):
        """Executes one step for the current agent."""
        if self.terminations[self.agent_selection] or self.truncations[self.agent_selection]:
            # This is the critical fix from our last error message
            self._was_dead_step(action)
            return

        agent = self.agent_selection
        state = self.agent_states[agent]

        # --- Action Consequences ---
        if action == 1:  # Buy
            if state["cash"] >= self.market_price:
                state["cash"] -= self.market_price
                state["assets"] += 1
                self.market_price *= 1.01  # Simulate price increase
                state["reputation"] += 0.01
                if self.db:
                    self.db.log_transaction(agent, 'buy', self.market_price, 1)

        elif action == 2:  # Sell
            if state["assets"] > 0:
                state["cash"] += self.market_price
                state["assets"] -= 1
                self.market_price *= 0.99  # Simulate price decrease
                state["reputation"] += 0.01
                if self.db:
                    self.db.log_transaction(agent, 'sell', self.market_price, 1)
        
        # Periodically log agent state (e.g., at the end of each full cycle)
        if self.db and self._agent_selector.is_last():
            self.db.log_agent_state(agent, state)
            
        # --- Update Environment State ---
        if self._agent_selector.is_last():
            # All agents have taken a turn, increment the main step counter
            self.steps += 1
            # Check for truncation (time limit)
            if self.steps >= self.max_steps:
                for ag in self.agents:
                    self.truncations[ag] = True
        
        # Select the next agent
        self.agent_selection = self._agent_selector.next()
        self._accumulate_rewards()

        if self.render_mode == 'human':
            self.render()

    def render(self):
        """Renders the environment state."""
        if self.render_mode == 'human':
            print(f"\n--- Step {self.steps} --- Market Price: ${self.market_price:.2f}")
            for agent in self.possible_agents:
                # Use a try-except block in case an agent's state is missing
                try:
                    state = self.agent_states[agent]
                    print(
                        f"{agent}: Cash: ${state['cash']:.2f}, "
                        f"Assets: {state['assets']}, Reputation: {state['reputation']:.2f}"
                    )
                except KeyError:
                    print(f"{agent}: (State not available)")

    def close(self):
        """Closes the environment and cleans up resources."""
        pass