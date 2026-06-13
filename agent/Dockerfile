# Bingocle agent service (AI Curator + Odds + Validation Oracle + organizer API).
#
# Build context = repo root (the COPY paths are repo-relative). ABIs are bundled at
# agent/abis (committed), so no contracts/out / Foundry checkout is needed:
#
#   docker build -f agent/Dockerfile -t bingocle-agent .
#   docker run -p 8787:8787 --env-file agent/.env bingocle-agent
#
FROM node:20-slim
WORKDIR /app/agent

# Install deps first (cached unless package.json changes).
COPY agent/package*.json ./
RUN npm install --no-audit --no-fund

# App source (includes agent/abis with the contract ABIs).
COPY agent ./

ENV PORT=8787
EXPOSE 8787
CMD ["npm", "start"]
