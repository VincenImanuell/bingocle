# Bingocle Capability — Telegram bot surface (channel-native chat).
# Self-contained: ABIs are embedded (src/abis.ts), so the build context is just
# this directory.
#
#   docker build -t bingocle-capability ./capability
#   docker run --env-file capability/.env bingocle-capability          # Telegram bot
#   docker run --env-file capability/.env bingocle-capability npm run email  # email surface
#
FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . ./

# Default process is the Telegram bot. Run the email surface with `npm run email`.
CMD ["npm", "start"]
