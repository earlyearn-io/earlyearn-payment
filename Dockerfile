FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM nginx:alpine

RUN apk add --no-cache logrotate cronie nodejs npm

# Copy nginx config and entrypoint
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy static files
COPY /public /usr/share/nginx/html

# Copy Node.js app
COPY --from=builder /app /app

WORKDIR /app

EXPOSE 80

CMD ["/entrypoint.sh"]
