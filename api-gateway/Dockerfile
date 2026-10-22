FROM node:24-alpine
# Misma estructura que en el repo: /app/api-gateway y /app/protos
WORKDIR /app/api-gateway

COPY api-gateway/package*.json ./
RUN npm install --omit=dev

COPY api-gateway/src ./src
COPY protos /app/protos

ENV PORT=8090
EXPOSE 8090
CMD ["node", "src/index.js"]