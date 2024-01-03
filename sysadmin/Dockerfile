FROM debian:latest

# setup initiator
COPY init.sh /
WORKDIR /
RUN chmod +x init.sh

# setup HTML
COPY public/ /usr/share/nginx/html/sysadmin

CMD [ "/usr/bin/bash", "-c", "/init.sh" ]
