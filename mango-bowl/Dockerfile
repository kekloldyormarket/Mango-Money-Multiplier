from node:16-slim
# version arg contains current git tag
ARG VERSION_ARG
# install git
RUN apt-get update && apt-get install -y git

# install mango-bowl globally (exposes mango-bowl command)
RUN npm install --global --unsafe-perm mango-bowl@$VERSION_ARG
# run it
CMD mango-bowl