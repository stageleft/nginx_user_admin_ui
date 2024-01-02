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

# setup initiator
COPY init.sh /
WORKDIR /
RUN chmod +x init.sh

CMD [ "/usr/bin/bash", "-c", "/init.sh" ]
