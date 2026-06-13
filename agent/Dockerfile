# Bingocle agent service (AI Curator + Odds + Validation Oracle + organizer API).
#
# IMPORTANT: build context MUST be the repo root, because the agent loads contract
# ABIs from contracts/out at runtime:
#
#   docker build -f agent/Dockerfile -t bingocle-agent .
#   docker run -p 8787:8787 --env-file agent/.env bingocle-agent
#
FROM node:20-slim
WORKDIR /app/agent

# Install deps first (cached unless package.json changes).
COPY agent/package*.json ./
RUN npm install --no-audit --no-fund

# App source + the Foundry build output the agent reads ABIs from.
COPY agent ./
COPY contracts/out /app/contracts/out

ENV PORT=8787
EXPOSE 8787
CMD ["npm", "start"]
