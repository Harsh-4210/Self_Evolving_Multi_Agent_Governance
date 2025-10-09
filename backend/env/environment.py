from pettingzoo.utils.agent_selector import agent_selector
from pettingzoo.utils.env import AECEnv
from gymnasium import spaces
import numpy as np
from .utils import get_initial_agent_state, get_action_space, get_observation_space

class DecentralizedEconomyEnv(AECEnv):
    metadata = {'render.modes': ['human']}
    
    def __init__(self, num_agents=5, max_steps=100):
        super().__init__()
        self._num_agents = num_agents
        self.agents = [f"agent_{i}" for i in range(self._num_agents)]
        self.possible_agents = self.agents[:]
        self.agent_name_mapping = {agent: i for i, agent in enumerate(self.agents)}
        
        self.max_steps = max_steps
        self.steps = 0
        
        # Initialize observation and action spaces per agent
        self._observation_spaces = {agent: get_observation_space() for agent in self.agents}
        self._action_spaces = {agent: get_action_space() for agent in self.agents}
        
        self.agent_selector = agent_selector(self.agents)
        self.agent_selection = None
        
        # State placeholders
        self.agent_states = {}
        self.dones = {}
        self.rewards = {}
        self.infos = {}

    def observation_space(self, agent):
        return self._observation_spaces[agent]
    
    def action_space(self, agent):
        return self._action_spaces[agent]

    def reset(self):
        self.steps = 0
        self.agents = self.possible_agents[:]
        self.agent_selection = self.agent_selector.reset()
        
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
        
        # Placeholder logic: reward incremental token + step count
        self.rewards[agent] = 1
        self.agent_states[agent]['tokens'] += 1
        
        self.steps += 1
        done = self.steps >= self.max_steps
        self.dones[agent] = done
        
        # Switch to next agent
        self.agent_selection = self.agent_selector.next()
        
        if all(self.dones.values()):
            self.agents = []
        
        # Return observation of the next agent
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
