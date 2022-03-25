FROM node:16

RUN npm install -g pm2

WORKDIR /usr
COPY package.json ./
COPY yarn.lock ./
COPY id.json ./
RUN yarn install
COPY . .
RUN yarn build
COPY install ./ 
ENV PORT=3000

CMD ["pm2-docker", "start", "dist/server.js", "-i", "2", "-n", "mango-service-v3", "--max-memory-restart", "200M"]
