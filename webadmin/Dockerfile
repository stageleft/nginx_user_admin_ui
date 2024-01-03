FROM node:latest

# setup initiator
COPY init.sh /
WORKDIR /
RUN chmod +x init.sh

# setup backend
COPY src/ /app
WORKDIR /app
RUN npm install
EXPOSE 3000

# setup frontend
COPY public/ /app/public
WORKDIR /app/public
RUN npm install

CMD [ "/usr/bin/bash", "-c", "/init.sh" ]
