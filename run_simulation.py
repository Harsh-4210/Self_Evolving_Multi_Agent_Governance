import os
from dotenv import load_dotenv
from backend.env.environment import DecentralizedEconomyEnv

def run_simulation():
    print("🚀 Starting simulation...")
    
    env = DecentralizedEconomyEnv({'max_steps': 100})

    obs, infos = env.reset()
    
    done = False
    while not done:
        actions = {}
        for agent in env.agents:
            actions[agent] = env.action_space[agent].sample()
        
        obs, rewards, terminations, truncations, infos = env.step(actions)
        
        done = all(terminations.values())
    
    env.close()
    print("✅ Simulation finished.")


if __name__ == "__main__":
    load_dotenv()
    run_simulation()
