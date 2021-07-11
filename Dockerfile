FROM node:13
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY server/package*.json ./
RUN npm install --production
COPY server .
EXPOSE 2500
CMD npm start