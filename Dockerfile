FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/auth_info_baileys /app/data

CMD ["npm", "run", "dev"]