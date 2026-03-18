# Synapse Council: Multi-Agent Consensus Engine

**Synapse Council** is a full-stack AI application built for the **DigitalOcean Gradient™ AI Hackathon**. It simulates complex group dynamics by orchestrating autonomous AI agents to reach a consensus on any given topic.

## 🚀 DigitalOcean Gradient™ AI Implementation

This project leverages the **full-stack features** of the DigitalOcean Gradient AI platform:

1.  **Managed Agent Platform**: Each council member (e.g., Dr. Elara, Prof. Kael) is a managed DigitalOcean Agent. We use the `/run` endpoint for direct, low-latency agent invocation.
2.  **Parent Agent Routing**: The "Moderator" acts as a Parent Agent, dynamically routing context and debate history to child agents to maintain a coherent conversation flow.
3.  **Inference Hub**: For general summarization and voting logic, we utilize the **Llama 3 8B Instruct** model via the Gradient Inference Hub.
4.  **Agent Discovery**: The application dynamically lists and discovers agents provisioned in your DigitalOcean account via the `/v2/gen-ai/agents` API.

## 🛠 Features

- **Autonomous Debate**: Agents argue, counter-argue, and update their stances based on logical influence.
- **Dynamic Influence Scoring**: Agents gain or lose influence based on the confidence and reasoning of their arguments.
- **Consensus Voting**: A final round where agents cast their votes, visualized in a real-time consensus dashboard.
- **Moderator Summary**: A Parent Agent summarizes the entire debate and provides a final verdict.

## 📦 Deployment on DigitalOcean

This app is production-ready and can be deployed to the **DigitalOcean App Platform** using the included `Dockerfile` and `app.yaml`.

### Environment Variables
- `DIGITALOCEAN_TOKEN`: Your DigitalOcean Personal Access Token.
- `GRADIENT_MODEL_ID`: (Optional) Default: `meta-llama-3-8b-instruct`.
- `MODERATOR_AGENT_UUID`: UUID of your Parent Moderator Agent.
- `AGENT_ELARA_UUID`, `AGENT_KAEL_UUID`, etc.: UUIDs for your specialized agents.

## 📜 License
This project is open-source under the **MIT License**.
