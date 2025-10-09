from backend.env.environment import DecentralizedEconomyEnv

def run_simple_test():
    env = DecentralizedEconomyEnv(num_agents=3, max_steps=10)
    observations = env.reset()
    print("Initial observations:", observations)
    
    done = False
    while env.agents:
        agent = env.agent_selection
        action = env.action_space(agent).sample()  # Random action
        print(f"Agent {agent} taking action {action}")
        obs = env.step(action)
        env.render()
        if not obs:
            break

if __name__ == "__main__":
    run_simple_test()
