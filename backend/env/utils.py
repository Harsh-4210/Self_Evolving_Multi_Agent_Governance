from gymnasium import spaces
import numpy as np

def get_initial_agent_state():
    # Start each agent with 10 tokens
    return {"tokens": 10}

def get_observation_space():
    # Simple observation: current token count (scalar)
    return spaces.Box(low=0, high=1000, shape=(1,), dtype=np.float32)

def get_action_space():
    # Example action space:
    # 0 = Pass, 1 = Propose new rule, 2 = Vote yes, 3 = Vote no, 4 = Trade tokens (simple placeholder)
    return spaces.Discrete(5)

def get_initial_agent_state():
    return {
        "cash": 1000.0,
        "assets": 0,
        "tokens": 10,
        "reputation": 1.0,
        "voting_power": 1.0,  # could tie to reputation for weighted voting
    }

def get_action_space():
    # 0 = Hold, 1 = Buy, 2 = Sell
    return spaces.Discrete(3)
