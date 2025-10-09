from pettingzoo.utils.agent_selector import agent_selector
from pettingzoo.utils.env import AECEnv
from gymnasium import spaces
import numpy as np
from .utils import get_initial_agent_state, get_action_space, get_observation_space

class DecentralizedEconomyEnv(AECEnv):
    metadata = {'render.modes': ['human']}
    
    def __init__(self, num_agents=5, max_steps=100):
        super().__init__()
        # Define different agent roles explicitly
        self.agents = ["trader_0", "trader_1", "validator_0", "rule_maker_0"]
        self.possible_agents = self.agents[:]
        self.agent_name_mapping = {agent: i for i, agent in enumerate(self.agents)}

        # Action space expanded based on Task 3.3:
        # 0: Hold, 1: Buy, 2: Sell, 3: Propose Rule, 4: Vote Yes, 5: Vote No, 6: Negotiate/Other
        self._action_spaces = {agent: spaces.Discrete(7) for agent in self.agents}

        # Observation includes cash, assets, market price, reputation (added for Task 4.2)
        self._observation_spaces = {agent: spaces.Box(low=0, high=1e6, shape=(5,), dtype=np.float32) for agent in self.agents}

        self.market_price = 100.0
        self.reputation = {agent: 1.0 for agent in self.agents}  # Task 4.2 reputation

        self.agent_states = {}
        self.dones = {}
        self.rewards = {}
        self.infos = {}
        self.agent_selector = agent_selector(self.agents)
        self.agent_selection = None

    def observation_space(self, agent):
        return self._observation_spaces[agent]
    
    def action_space(self, agent):
        return self._action_spaces[agent]

    def reset(self):
        self.steps = 0
        self.agents = self.possible_agents[:]
        self.agent_selection = self.agent_selector.reset()
        self.market_price = 100.0
        self.agent_states = {agent: get_initial_agent_state() for agent in self.agents}
        
        self.agent_states = {agent: get_initial_agent_state() for agent in self.agents}
        self.dones = {agent: False for agent in self.agents}
        self.rewards = {agent: 0 for agent in self.agents}
        self.infos = {agent: {} for agent in self.agents}
        
        return self._observe(self.agent_selection)
    
    def step(self, action):
        agent = self.agent_selection
        if self.dones[agent]:
            self._was_done_step(action)
            return

        state = self.agent_states[agent]

        # Example random or explicit action handling
        if action == 1:  # Buy
            if state["cash"] >= self.market_price:
                state["cash"] -= self.market_price
                state["assets"] += 1
                self.market_price *= 1.01
                state["reputation"] += 0.1  # Reward for successful trade
        elif action == 2:  # Sell
            if state["assets"] > 0:
                state["cash"] += self.market_price
                state["assets"] -= 1
                self.market_price *= 0.99
                state["reputation"] += 0.1
        elif action == 3:  # Propose Rule (calls governance module)
            # governance.start_new_proposal(...)
            pass
        elif action == 4:  # Vote Yes
            # governance.cast_vote(agent, True)
            pass
        elif action == 5:  # Vote No
            # governance.cast_vote(agent, False)
            pass
        elif action == 6:  # Negotiate
            # implement negotiation protocols later
            pass

        # Update agent state
        self.agent_states[agent] = state

        # Rewards, done flags, info dictionaries updated accordingly
        self.rewards[agent] = 0  
        self.dones[agent] = False

        self.agent_selection = self.agent_selector.next()    
        return self._observe(self.agent_selection)

    
    def _observe(self, agent):
        if agent is None or self.dones.get(agent, True):
            return None
        # Extract agent-specific observation
        state = self.agent_states.get(agent, {})
        obs = np.array([state.get('tokens', 0)], dtype=np.float32)
        return obs
    
    def render(self, mode='human'):
        # Minimal render: print token counts
        print(f"Step {self.steps}:")
        for agent, state in self.agent_states.items():
            print(f"{agent}: Tokens = {state['tokens']}")
