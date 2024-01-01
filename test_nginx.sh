#! /usr/bin/bash

echo
echo ■■■ curl http://localhost/
curl http://localhost/

echo
echo ■■■ curl http://localhost/webadmin/
curl http://localhost/webadmin/
echo ■ curl http://localhost/webadmin/ -u sysadmin:syspass
curl http://localhost/webadmin/ -u sysadmin:syspass
echo ■ curl http://localhost/webadmin/ -u webadmin:webpass
curl http://localhost/webadmin/ -u webadmin:webpass
echo ■ curl http://localhost/webadmin/api/ -u webadmin:webpass
curl http://localhost/webadmin/api/ -u webadmin:webpass ; echo
echo ■ curl -X POST http://localhost/webadmin/ -u webadmin:webpass
curl -X POST http://localhost/webadmin/ -u webadmin:webpass
echo ■ curl -X POST http://localhost/webadmin/api/ -u webadmin:webpass
curl -X POST http://localhost/webadmin/api/ -u webadmin:webpass ; echo

echo
echo ■■■ curl http://localhost/sysadmin/
curl http://localhost/sysadmin/
echo ■ curl http://localhost/sysadmin/ -u sysadmin:syspass
curl http://localhost/sysadmin/ -u sysadmin:syspass
