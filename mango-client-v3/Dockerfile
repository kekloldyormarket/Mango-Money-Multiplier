FROM node:16
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get update
ADD . /home/
WORKDIR /home

RUN npm install -g pm2

RUN yarn && yarn build
EXPOSE 3138
CMD [ "pm2-docker", "start", "lib/examples/server.js", "-i", "2", "-n", "mango-client-v3", "--max-memory-restart", "10G"]

