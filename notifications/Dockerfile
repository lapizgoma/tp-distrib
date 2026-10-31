FROM node:24-alpine

WORKDIR /app/notifications

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

ENV PORT=8084
EXPOSE 8084
CMD ["node", "src/index.js"]