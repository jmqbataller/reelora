FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
COPY SKILL.md README.md ./
COPY docs ./docs
COPY examples ./examples

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV REELORA_DATA_DIR=/data

VOLUME ["/data"]
EXPOSE 3000

CMD ["npm", "start"]
