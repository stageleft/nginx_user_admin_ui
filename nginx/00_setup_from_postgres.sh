#!/usr/bin/bash

# remove previous settings
find '/etc/nginx/conf.d/' -type f -name "*.sec" | while read -r f; do
  rm "$f" 
done

# generate current settings
node /node_apps/index.js
