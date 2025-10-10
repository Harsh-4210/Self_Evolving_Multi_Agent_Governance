import ray
from ray import tune
from dotenv import load_dotenv
from ray.tune.registry import register_env
from ray.rllib.algorithms.ppo import PPO
from backend.env.environment import DecentralizedEconomyEnv


def main():
    env_name = "DecentralizedEconomy"
    register_env(env_name, lambda config: DecentralizedEconomyEnv(config))

    env_config = {
        "num_agents": 8,
        "max_steps": 120,
        "price_range": (50.0, 150.0),
        "tax_range": (0.01, 0.20),
        "volatility_range": (1.005, 1.05)
    }
    temp_env = DecentralizedEconomyEnv(env_config)

    obs_space = temp_env.observation_space["agent_0"]
    act_space = temp_env.action_space["agent_0"]

    policies = {
        agent_id: (None, obs_space, act_space, {}) for agent_id in temp_env.agents
    }

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
        "num_envs_per_env_runner": 2,
        "num_gpus": 1,
        "train_batch_size": 4096,
        "sgd_minibatch_size": 256,
        "num_sgd_iter": 5,
        "_enable_new_api_stack": False,
        "disable_env_checking": True,
        "lr": 1e-4,
        "model": {
            "use_lstm": True,
            "lstm_cell_size": 256,
            "max_seq_len": 20,
        },
    }

    checkpoint_path = r"C:\Users\Yash\ray_results\DecentralizedEconomy_Meta_POC\checkpoint_000001"
    algo = PPO(config=config)
    algo.restore(checkpoint_path)
    print(f"Restored checkpoint from {checkpoint_path}")

    print("\n🚀 Starting final POC meta-learning training with Ray Tune...")
    print("Results saved in: ~/ray_results/")
    print("Monitor progress via: tensorboard --logdir ~/ray_results\n")

    try:
        tune.run(
            "PPO",
            config=config,
            stop={"training_iteration": 100},
            checkpoint_freq=10,
            checkpoint_at_end=True,
            name="DecentralizedEconomy_Meta_POC",
            verbose=1,
        )
    finally:
        if hasattr(temp_env, "db"):
            temp_env.db.shutdown()
        ray.shutdown()
        print("\n✅ Final POC meta-learning completed, all logs flushed.")


if __name__ == "__main__":
    load_dotenv()
    if ray.is_initialized():
        ray.shutdown()
    ray.init(ignore_reinit_error=True)
    main()
