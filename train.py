import ray
from ray import tune
from ray.rllib.algorithms.ppo import PPOConfig
from ray.tune.registry import register_env
from backend.env.environment import DecentralizedEconomyEnv


def env_creator(env_config):
    return DecentralizedEconomyEnv(env_config)


def policy_mapping_fn(agent_id, episode=None, worker=None, **kwargs):
    return agent_id


if __name__ == "__main__":
    ray.init(ignore_reinit_error=True)

    env_name = "DecentralizedEconomy"
    register_env(env_name, env_creator)

    env_config = {"num_agents": 2}

    temp_env = DecentralizedEconomyEnv(env_config)

    policies = {
        agent: (
            None,
            temp_env.observation_space(agent),
            temp_env.action_space(agent),
            {},
        )
        for agent in temp_env.agents
    }

    config = (
        PPOConfig()
        .environment(env=env_name, env_config=env_config, disable_env_checking=True)
        .framework("torch")
        .rollouts(num_rollout_workers=1)
        .training(lr=1e-3)
        .multi_agent(policies=policies, policy_mapping_fn=policy_mapping_fn)
    )

    tune.run(
        "PPO",
        config=config.to_dict(),
        stop={"training_iteration": 50},
        checkpoint_freq=10,
        keep_checkpoints_num=2,
        checkpoint_at_end=True,
        name="DecentralizedEconomy_Training",
        verbose=1,
    )

    ray.shutdown()
