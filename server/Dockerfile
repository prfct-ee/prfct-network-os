FROM node:14-alpine

WORKDIR /usr/src/app
COPY . /usr/src/app

ENV PATH /usr/local/lib/node_modules/pm2/node_modules/.bin:$PATH

RUN npm install pm2@latest --global
RUN pm2 install typescript
RUN npm i --silent

EXPOSE 8080
CMD [ "npm", "start" ]