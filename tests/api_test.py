import numpy as np

def api_test(env):
    """
    Simple PettingZoo environment API compliance test.
    """

    print("Starting API Test for environment:", env.__class__.__name__)

    # Check required attributes and methods
    required_methods = ['reset', 'step', 'render', 'close', 'observation_space', 'action_space']
    for method in required_methods:
        assert hasattr(env, method), f"Environment missing required method: {method}"

    # Reset environment and check initial observations
    obs = env.reset()
    assert obs is not None, "Reset did not return initial observation"

    # Check agents list is valid
    assert hasattr(env, 'agents'), "Environment must have 'agents' attribute"
    assert len(env.agents) > 0, "'agents' list must not be empty after reset"

    # Check observation space and action space for first agent
    first_agent = env.agents[0]
    obs_space = env.observation_space(first_agent)
    act_space = env.action_space(first_agent)

    assert obs_space is not None, "Observation space must be defined"
    assert act_space is not None, "Action space must be defined"

    # Run a few steps with random actions to check step functionality
    max_steps = 10
    steps_run = 0

    for _ in range(max_steps):
        agent = env.agent_selection
        if env.dones.get(agent, True):
            env._was_done_step(None)
            continue

        action = act_space.sample()
        obs = env.step(action)

        # Check observation type (should be numpy array or None if done)
        if obs is not None:
            assert isinstance(obs, (np.ndarray, type(None))), "Obs must be numpy array or None"
        else:
            assert env.dones[agent], "Observation is None only if agent is done"

        env.render()
        steps_run += 1

        if not env.agents:
            break

    print(f"API Test Passed: Ran {steps_run} steps successfully.")


if __name__ == "__main__":
    # For local standalone testing, import your environment here
    from backend.env.environment import DecentralizedEconomyEnv
    env = DecentralizedEconomyEnv(num_agents=3)
    api_test(env)
