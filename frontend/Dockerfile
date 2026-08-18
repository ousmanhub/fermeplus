FROM node:20-slim AS builder

WORKDIR /app

ENV NODE_OPTIONS=--max-old-space-size=4096

COPY package*.json ./
RUN npm install --no-audit --no-fund --no-progress

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
