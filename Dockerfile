# build environment
FROM node:14-alpine as build
WORKDIR /frontend
ENV PATH /frontend/node_modules/.bin:$PATH
COPY ./frontend/package.json ./
COPY ./frontend/src/network/package.json ./src/network/
RUN npm i
RUN npm i --prefix ./src/network/
COPY ./frontend ./
RUN npm run build
# RUN npm run build-storybook

# production environment
FROM nginx:stable-alpine
COPY --from=build /frontend/build /usr/share/nginx/html
# COPY --from=build /frontend/storybook-static /usr/share/nginx/html/sb
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]