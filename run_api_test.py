from pettingzoo.tests.api_test import api_test
from backend.env.environment import DecentralizedEconomyEnv

env = DecentralizedEconomyEnv(num_agents=3)

api_test(env)
