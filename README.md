# Self-Evolving Multi-Agent Governance in a Decentralized Economy

A decentralized multi-agent system for self-evolving governance, negotiation, and conflict resolution in a digital economy. This project was built for the Fusion in 24 hours.

## 🎯 Objective

To build a decentralized multi-agent system where reinforcement learning (RL) agents autonomously create, enforce, and adapt governance rules (e.g., token policies, trading rules). The system showcases emergent behaviors, including automated negotiation and trust-based reputation systems, without central control.



## ✨ Key Features

- **Dynamic Governance:** Agents propose and vote on new rules using Reputation-Weighted Quadratic Voting.
- **Autonomous Conflict Resolution:** Game-theoretic negotiation protocols (Nash bargaining) to resolve disputes automatically.
- **Adaptive Agents:** Meta-learning allows agents to rapidly adapt policies to new rules and market shocks.
- **Live Visualization:** A real-time dashboard built with Dash/Plotly to monitor the economy, agent reputations, and governance evolution.

## 🛠️ Tech Stack

- **Multi-Agent RL:** Ray RLlib, PettingZoo
- **RL Algorithms:** PPO, SAC
- **Governance & Communication:** Custom Modules, gRPC/Redis
- **Meta-Learning:** learn2learn
- **Data & Visualization:** PostgreSQL, Dash/Plotly
- **Deployment:** Docker, Kubernetes
  
 ## ⚙️ Setup & Prerequisites

This project requires **Python 3.10**.

To create the correct environment, run the following commands:
```bash
# Create a virtual environment using Python 3.10
py -3.10 -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install the required packages
pip install -r requirements.txt
```

## 🚀 How to Run

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Harsh-4210/Self_Evolving_Multi_Agent_Governance.git
    cd multi-agent-governance-hackathon
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the simulation:**
    ```bash
    python src/main.py --config configs/dynamic_gov_config.yaml
    ```

4.  **Launch the dashboard:**
    ```bash
    python dashboard/app.py
    ```
    Visit `http://127.0.0.1:8050` in your browser.

## 📊 Performance Metrics

We demonstrate superior performance over a static-rule baseline using:
- **Adaptability:** Faster recovery from market shocks.
- **Fairness:** Lower Gini coefficient for resource distribution.
- **Stability:** Reduced token price volatility.
- **Conflict Resolution Rate:** High percentage of autonomously resolved disputes.
