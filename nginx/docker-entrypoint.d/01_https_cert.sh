#!/usr/bin/bash

# remove previous HTTPS private key
find '/etc/nginx/conf.d/' -type f -name "*.key" | while read -r f; do
  rm "$f" 
done
# remove previous HTTPS certificate
find '/etc/nginx/conf.d/' -type f -name "*.crt" | while read -r f; do
  rm "$f" 
done

# generate current HTTPS key and certificate
while ! node /set_https_cert/index.js ; do
  sleep 1; # wait for boot up of dbserver
done

# check and retry generating current HTTPS key and certificate
find '/etc/nginx/conf.d/' -type f -name "*.key" -or -name "*.crt" | while read -r f; do
  if [ $(wc -c < ${f}) -eq 0 ]; then
    sleep 1;
    /usr/bin/bash -c "$0"
  fi
done
