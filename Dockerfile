FROM node

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

RUN mv ./tools/ENV_VARS.js ./tools/ENV_VARS.temp.js
RUN apt-get update
RUN yes | apt-get install gettext

EXPOSE 8080

ENTRYPOINT ["/bin/bash", "-c", "envsubst < ./tools/ENV_VARS.temp.js > ./tools/ENV_VARS.js && npm start"]
