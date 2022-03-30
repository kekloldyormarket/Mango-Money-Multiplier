FROM node:16
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get update
ADD . /home/

WORKDIR /home/
RUN apt-get install python3 python3-pip python3-dev -y 
RUN python3 get-poetry.py 
RUN source ~/.poetry/env && poetry install 
RUN pip3 install tenacity httpx pydantic requests
RUN npm install -g pm2
RUN ln -sf /usr/bin/python3 /usr/bin/python

CMD [ "pm2-docker", "./example3_market_maker.py" ]