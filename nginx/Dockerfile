FROM nginx

COPY 000_setup_from_postgres.sh /docker-entrypoint.d/

EXPOSE 80
CMD [ "/docker_entrypoint.sh" ]