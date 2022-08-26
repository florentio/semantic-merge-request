FROM node:16-alpine

ENV WEBHOOK_SERVER_PORT=80
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
# Create app directory
WORKDIR /usr/src/app

# Copy sources files
COPY . .

# Install dependencies
RUN npm install

EXPOSE 80

CMD ["node", "index.js"]
