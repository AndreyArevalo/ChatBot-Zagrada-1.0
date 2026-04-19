FROM node:20-alpine

# Herramientas necesarias para compilar better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/auth_info_baileys /app/data

CMD ["node", "src/index.js"]