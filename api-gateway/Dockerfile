FROM node:24-alpine

WORKDIR /app/api-gateway

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY --from=protos . /app/protos

ENV PORT=8090
EXPOSE 8090
CMD ["node", "src/index.js"]