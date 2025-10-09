#environment.py
import numpy as np
import gymnasium as gym
from gymnasium import spaces
from ray.rllib.env import MultiAgentEnv


class DecentralizedEconomyEnv(MultiAgentEnv):
    def __init__(self, env_config=None):
        # RLlib passes ENV_CONFIG as dict or None
        env_config = env_config or {}
        self.num_agents = env_config.get("num_agents", 5)
        self.max_steps = env_config.get("max_steps", 100)
        # Define agents and spaces
        self.agents = [f"agent_{i}" for i in range(self.num_agents)]
        self.action_spaces = {agent: spaces.Discrete(7) for agent in self.agents}
        self.observation_spaces = {
            agent: spaces.Box(low=0, high=1e6, shape=(5,), dtype=np.float32)
            for agent in self.agents
        }
        self.market_price = 100.0
        self.steps = 0
        self.agent_states = {}

    def observation_space(self, agent_id):
        return self.observation_spaces[agent_id]

    def action_space(self, agent_id):
        return self.action_spaces[agent_id]

    def reset(self, *, seed=None, options=None):
        self.steps = 0
        self.agent_states = {
            agent: self._get_initial_state() for agent in self.agents
        }
        obs = {agent: self._get_obs(agent) for agent in self.agents}
        infos = {agent: {} for agent in self.agents}
        return obs, infos

    def step(self, action_dict):
        self.steps += 1
        obs, rewards, terminations, truncations, infos = {}, {}, {}, {}, {}

        for agent, action in action_dict.items():
            state = self.agent_states[agent]
            old_cash = state["cash"]

            # Action effects simplified
            if action == 0:
                pass  # hold
            elif action == 1:  # buy
                if state["cash"] >= self.market_price:
                    state["cash"] -= self.market_price
                    state["assets"] += 1
                    self.market_price *= 1.01
            elif action == 2:  # sell
                if state["assets"] > 0:
                    state["cash"] += self.market_price
                    state["assets"] -= 1
                    self.market_price *= 0.99
            # other actions 3..6 update reputation for example
            elif action == 3:
                state["reputation"] += 0.05
            elif action == 4 or action == 5:
                state["reputation"] += 0.02
            elif action == 6:
                state["reputation"] += 0.03

            self.agent_states[agent] = state

            rewards[agent] = state["cash"] - old_cash
            obs[agent] = self._get_obs(agent)
            infos[agent] = {}

            done = self.steps >= self.max_steps
            terminations[agent] = done
            truncations[agent] = False

        terminations["__all__"] = self.steps >= self.max_steps
        truncations["__all__"] = False

        return obs, rewards, terminations, truncations, infos

    def _get_obs(self, agent):
        state = self.agent_states[agent]
        return np.array(
            [
                state.get("cash", 0),
                state.get("assets", 0),
                state.get("tokens", 0),
                self.market_price,
                state.get("reputation", 0),
            ],
            dtype=np.float32,
        )

    def _get_initial_state(self):
        return {
            "cash": 1000.0,
            "assets": 0,
            "tokens": 10,
            "reputation": 1.0,
        }