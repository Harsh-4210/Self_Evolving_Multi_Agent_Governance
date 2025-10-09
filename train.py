import ray
from ray import tune
from ray.tune.registry import register_env

# Ensure this import path matches your project structure
from backend.env.environment import DecentralizedEconomyEnv

def main():
    """Main function to configure and run the training."""
    
    # --- 1. Registration ---
    env_name = "DecentralizedEconomy"
    register_env(env_name, lambda config: DecentralizedEconomyEnv(config))

    # --- 2. Configuration ---
    env_config = {"num_agents": 4}
    temp_env = DecentralizedEconomyEnv(env_config)

    ### THE FIX: Correctly access the spaces from the dictionary ###
    # Get the space for a single agent (since they are all the same)
    obs_space = temp_env.observation_space["agent_0"]
    act_space = temp_env.action_space["agent_0"]
    
    # Define policies using the single space objects
    policies = {
        agent_id: (None, obs_space, act_space, {})
        for agent_id in temp_env.agents
    }
    #############################################################

    # Use a classic dictionary for configuration
    config = {
        "env": env_name,
        "env_config": env_config,
        "multiagent": {
            "policies": policies,
            "policy_mapping_fn": (lambda agent_id, *args, **kwargs: agent_id),
        },
        "framework": "torch",
        "num_workers": 2,
        "lr": 1e-4,
        "_enable_new_api_stack": False,
        "disable_env_checking": True,
    }

    # --- 3. Execution ---
    print("\nStarting training with Ray Tune...")
    print("Results will be saved in: ~/ray_results/")
    print("You can monitor progress with: tensorboard --logdir ~/ray_results/\n")
    
    tune.run(
        "PPO",
        config=config,
        stop={"training_iteration": 100},
        checkpoint_freq=10,
        checkpoint_at_end=True,
        name="DecentralizedEconomy_Training",
        verbose=1,
    )

    print("\nTraining finished.")
    ray.shutdown()

if __name__ == "__main__":
    if ray.is_initialized():
        ray.shutdown()
    ray.init()
    main()