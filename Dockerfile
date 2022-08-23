FROM node:16-alpine

ENV WEBHOOK_SERVER_PORT=8080
# Create app directory
WORKDIR /usr/src/app

# Copy sources files
COPY . .


# Install dependencies
RUN yarn install

EXPOSE 8080

CMD ["node", "index.js"]
