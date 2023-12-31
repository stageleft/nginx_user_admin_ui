#! /usr/bin/bash

curl http://localhost/
curl http://localhost/webadmin/
curl http://localhost/webadmin/ -u webadmin:webpass
curl http://localhost/webadmin/ -u sysadmin:syspass
curl http://localhost/sysadmin/
curl http://localhost/sysadmin/ -u sysadmin:syspass
