# run_simulation.py

import os
from dotenv import load_dotenv
from backend.env.environment import DecentralizedEconomyEnv

def run_simulation():
    """
    Main function to initialize and run the simulation.
    """
    print("🚀 Starting simulation...")
    
    # Initialize the environment. The __init__ method will handle the db connection.
    env = DecentralizedEconomyEnv(render_mode='human', max_steps=100)
    env.reset()
    
    # Run the simulation loop for each agent
    for agent in env.agent_iter():
        observation, reward, termination, truncation, info = env.last()

        if termination or truncation:
            action = None
        else:
            # Get a random action from the agent's action space
            action = env.action_space(agent).sample()
            print(f"Step {env.steps}: Agent '{agent}' takes action '{action}'")

        env.step(action)

    env.close()
    print("✅ Simulation finished.")


if __name__ == "__main__":
    # This is the most important part for the .env file to work
    # Load environment variables from .env file BEFORE doing anything else
    load_dotenv()
    
    # Now, run the main simulation function
    run_simulation()