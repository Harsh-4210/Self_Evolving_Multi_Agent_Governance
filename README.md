# 🧠 Self-Evolving Multi-Agent Governance in a Decentralized Economy

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Reinforcement Learning](https://img.shields.io/badge/RL-PPO%20%7C%20SAC-orange.svg)]()
[![Framework](https://img.shields.io/badge/Framework-Ray%20RLlib%20%7C%20PettingZoo-green.svg)]()
[![Meta-Learning](https://img.shields.io/badge/Meta--Learning-learn2learn-purple.svg)]()
[![Dashboard](https://img.shields.io/badge/Dashboard-Dash%20%7C%20Plotly-blueviolet.svg)]()
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)]()

> A **decentralized multi-agent system** enabling *autonomous governance, negotiation, and conflict resolution* within a digital economy.  
> Developed in just **24 hours** during the **Fusion Hackathon 2025**, this project demonstrates **self-organizing governance** powered by reinforcement learning and adaptive intelligence.

---

## 🎯 Objective

To design and implement a **self-evolving governance framework** where **reinforcement learning (RL) agents** autonomously **propose, enforce, and evolve** governance rules — such as token policies, transaction regulations, and market mechanisms.  

The system exhibits **emergent economic behaviors**, including automated negotiation, consensus formation, and reputation-based trust — all without centralized control.

---

## ✨ Key Features

- 🗳️ **Dynamic Governance System**  
  Agents propose and modify rules using **Reputation-Weighted Quadratic Voting**, ensuring fairness and proportional influence.

- 🤝 **Autonomous Conflict Resolution**  
  Disputes are resolved via **game-theoretic negotiation protocols** (Nash Bargaining), fostering stability and cooperation.

- 🧬 **Adaptive & Meta-Learning Agents**  
  Agents continuously learn through **meta-reinforcement learning (learn2learn)**, adapting to evolving policies and market conditions.

- 📊 **Real-Time Visualization Dashboard**  
  A live **Dash/Plotly dashboard** provides visibility into governance changes, market metrics, agent reputations, and conflict resolutions.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Multi-Agent Simulation** | Ray RLlib, PettingZoo |
| **Reinforcement Learning** | PPO, SAC |
| **Governance & Communication** | Custom Python Modules, gRPC, Redis |
| **Meta-Learning** | learn2learn |
| **Data & Visualization** | PostgreSQL, Dash, Plotly |
| **Deployment** | Docker, Kubernetes |

---

## ⚙️ Setup & Installation

### **Prerequisites**
- Python **3.10+**
- Docker (optional, for containerized deployment)

### **Steps**
```bash
# Clone the repository
git clone https://github.com/Harsh-4210/Self_Evolving_Multi_Agent_Governance.git
cd Self-Evolving-Multi-Agent-Governance-Hackathon

# Create a virtual environment
py -3.10 -m venv venv

# Activate the environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
