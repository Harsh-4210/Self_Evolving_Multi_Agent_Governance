# train.py

import ray
from ray import tune
from dotenv import load_dotenv
from ray.tune.registry import register_env
from backend.env.environment import DecentralizedEconomyEnv

def main():
    """Final optimized training script for DecentralizedEconomy POC."""

    # ---------- 1. Register environment ----------
    env_name = "DecentralizedEconomy"
    register_env(env_name, lambda config: DecentralizedEconomyEnv(config))

    # ---------- 2. Environment configuration ----------
    # META-LEARNING: Define parameter ranges for the distribution of tasks.
    env_config = {
        "num_agents": 8,                  # Rich POC interactions
        "max_steps": 120,                 # Enough for trading + governance
        "price_range": (50.0, 150.0),     # Starting market price range
        "tax_range": (0.01, 0.20),        # Starting tax rate range
        "volatility_range": (1.005, 1.05) # Market volatility range
    }
    temp_env = DecentralizedEconomyEnv(env_config)

    # Access observation and action spaces for policy definitions
    obs_space = temp_env.observation_space["agent_0"]
    act_space = temp_env.action_space["agent_0"]

    # ---------- 3. Multi-agent policy setup ----------
    policies = {
        agent_id: (None, obs_space, act_space, {}) for agent_id in temp_env.agents
    }

    # ---------- 4. RLlib PPO configuration ----------
    config = {
        "env": env_name,
        "env_config": env_config,
        "multiagent": {
            "policies": policies,
            "policy_mapping_fn": lambda agent_id, *args, **kwargs: agent_id,
        },
        "framework": "torch",
        "torch_compile": True,
        "num_workers": 8,
        "num_envs_per_runner": 2,    # 16 parallel envs in total,
        "num_gpus": 1,
        "train_batch_size": 4096,
        "sgd_minibatch_size": 256,
        "num_sgd_iter": 5,
        "_enable_new_api_stack": False,
        "disable_env_checking": True,
        "lr": 1e-4,

        # META-LEARNING: Use a recurrent model (LSTM) to give agents memory for adaptation.
        "model": {
            "use_lstm": True,
            "lstm_cell_size": 256,
            "max_seq_len": 20,  # The number of steps the agent can "remember".
        },
    }

    # ---------- 5. Start training ----------
    print("\n🚀 Starting final POC meta-learning with Ray Tune...")
    print("Results saved in: ~/ray_results/")
    print("Monitor progress via: tensorboard --logdir ~/ray_results\n")

    try:
        tune.run(
            "PPO",
            config=config,
            stop={"training_iteration": 100},
            checkpoint_freq=10,
            checkpoint_at_end=True,
            name="DecentralizedEconomy_Meta_POC", # Updated name for the new run
            verbose=1,
        )
    finally:
        # ---------- 6. Graceful shutdown ----------
        if hasattr(temp_env, "db"):
            temp_env.db.shutdown()  # flush all Supabase logs
        ray.shutdown()
        print("\n✅ Final POC meta-learning completed, all logs flushed.")


if __name__ == "__main__":
    load_dotenv()
    if ray.is_initialized():
        ray.shutdown()
    ray.init(ignore_reinit_error=True)
    main()