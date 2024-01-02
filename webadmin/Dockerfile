FROM node:latest

COPY src/ /app
COPY public/ /app/public
WORKDIR /app
RUN npm install

EXPOSE 3000

CMD [ "node", "index.js" ]