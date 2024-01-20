#!/usr/bin/bash

# remove previous BASIC Auth settings
find '/etc/nginx/conf.d/' -type f -name "*.sec" | while read -r f; do
  rm "$f" 
done

# generate current BASIC Auth settings
while ! node /set_basic_auth_user/index.js ; do
  sleep 1; # wait for boot up of dbserver
done

# check and retry generating current BASIC Auth settings
find '/etc/nginx/conf.d/' -type f -name "*.sec" | while read -r f; do
  if [ $(wc -c < ${f}) -eq 0 ]; then
    sleep 1;
    /usr/bin/bash -c "$0"
  fi
done
