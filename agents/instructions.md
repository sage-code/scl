# Instructions for Managing Agents

This directory contains configuration and instructions for different AI agents used in this project.
Each agent has its own subfolder containing specific instructions.

- `/gemini`: Instructions and configuration for Gemini.
- `/claudio`: Instructions and configuration for Claudio.
- `/copilot`: Instructions and configuration for GitHub Copilot.
- `/deepseek`: Instructions for DeepSeek (Fireworks architect/dispatcher — decomposes work and dispatches micro-specs to GLM).
- `/glm`: Instructions for GLM (Fireworks worker/executor — drafts and rewords from DeepSeek micro-specs with minimal output).
- `fireworks.md`: Shared Fireworks configuration (endpoint, model IDs, pricing, prompt caching, escalation, validation, shared project rules, scripts & cleanup policy) used by the DeepSeek and GLM agents.

