FROM node:16
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get update
ADD get-poetry.py /home/
ADD *.toml /home/

WORKDIR /home/
RUN apt-get install python3 python3-pip python3-dev -y 

RUN pip3 install tenacity httpx pydantic requests
RUN python3 get-poetry.py --version 1.2.0
RUN npm install -g pm2
RUN ln -sf /usr/bin/python3 /usr/bin/python

ADD . /home/
RUN source ~/.poetry/env && poetry install 
CMD [ "pm2-docker", "./example3_market_maker.py" ]