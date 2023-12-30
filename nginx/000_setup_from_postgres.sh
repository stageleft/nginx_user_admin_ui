#!/usr/bin/bash

# remove previous settings
find '/etc/nginx/conf.d/' -type f | grep -v 'default.conf' | while read -r f; do
  rm "$f" 
done

# add new setting
cp /datavol/nginx_settings/*.conf /etc/nginx/conf.d/
cp /datavol/nginx_settings/*.sec /etc/nginx/conf.d/
