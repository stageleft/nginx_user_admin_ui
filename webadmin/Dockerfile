FROM node:latest

# setup frontend
COPY public/ /app/public
WORKDIR /app/public
RUN npm install

# setup backend
COPY src/ /app
WORKDIR /app
RUN npm install
EXPOSE 3000

CMD [ "node", "index.js" ]