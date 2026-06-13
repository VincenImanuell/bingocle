# Bingocle agent service (AI Curator + Odds + Validation Oracle + organizer API).
#
# Self-contained: ABIs are bundled at agent/abis, so the build context is just this
# directory. On Railway, set the service Root Directory to `agent` and it auto-uses
# this Dockerfile (no Railpack). Locally:
#
#   docker build -t bingocle-agent ./agent
#   docker run -p 8787:8787 --env-file agent/.env bingocle-agent
#
FROM node:20-slim
WORKDIR /app

# Install deps first (cached unless package.json changes).
COPY package*.json ./
RUN npm install --no-audit --no-fund

# App source (includes ./abis with the contract ABIs).
COPY . ./

ENV PORT=8787
EXPOSE 8787
CMD ["npm", "start"]
