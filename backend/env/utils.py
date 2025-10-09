# backend/utils/utils.py
from gymnasium import spaces
import numpy as np

# ---------- Agent State ----------
def get_initial_agent_state(cash=1000.0, assets=0, tokens=100, reputation=1.0, voting_power=1.0):
    """
    Returns the starting state for a single agent.
    Includes optional tracking for last action and total trades.
    """
    return {
        "cash": cash,
        "assets": assets,
        "tokens": tokens,
        "reputation": reputation,
        "voting_power": voting_power,
        "last_action": None,
        "total_trades": 0
    }

# ---------- Action Space ----------
def get_action_space():
    """
    Returns a Discrete action space for agent decisions:
    0 = Hold
    1 = Buy
    2 = Sell
    3 = Propose Rule
    4 = Vote Yes
    5 = Vote No
    """
    return spaces.Discrete(6)

# ---------- Observation Space ----------
def get_observation_space():
    """
    Returns a Box observation space with:
    [cash, assets, tokens, market_price, reputation, tax_rate]
    """
    return spaces.Box(low=0, high=1e6, shape=(6,), dtype=np.float32)
