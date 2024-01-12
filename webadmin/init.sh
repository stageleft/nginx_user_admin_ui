#!/usr/bin/bash

# psql bootup waiting
# webadmin_password / webadmin existence check
# re-create webadmin_password / webadmin if removed
while ! /usr/local/bin/node /app/pre_boot.js ; do
    sleep 1;
done

while : ; do
    /usr/local/bin/node /app/index.js
    sleep 1;
done
