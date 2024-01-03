#! /usr/bin/bash

echo
echo ■■■ curl http://localhost/
curl http://localhost/

echo
echo ■■■ curl http://localhost/webadmin/
echo ■■ 200 success case
echo ■ curl http://localhost/webadmin/ -u sysadmin:syspass
curl http://localhost/webadmin/ -u sysadmin:syspass
echo ■ curl http://localhost/webadmin/ -u webadmin:webpass
curl http://localhost/webadmin/ -u webadmin:webpass
echo ■ curl http://localhost/webadmin/api/ -u webadmin:webpass
curl http://localhost/webadmin/api/ -u webadmin:webpass ; echo
echo ■ curl -X POST http://localhost/webadmin/api/ -u webadmin:webpass
curl -X POST -u webadmin:webpass \
     -H "Content-Type: application/json" \
     -d '{"file":"dummuy_passwd", "username":"dummyuser", "password":"dummypassword"}'\
     http://localhost/webadmin/api/ ; echo
curl -X POST -u webadmin:webpass \
     -H "Content-Type: application/json" \
     -d '{"file":"dummuy_passwd", "username":"dummyuser2", "password":"dummy2password", "comment":"dummycomment"}'\
     http://localhost/webadmin/api/ ; echo
echo ■ curl http://localhost/webadmin/api/ -u webadmin:webpass
curl http://localhost/webadmin/api/ -u webadmin:webpass ; echo
echo ■ curl -X PUT http://localhost/webadmin/api/ -u webadmin:webpass
curl -X PUT -u webadmin:webpass \
     -H "Content-Type: application/json" \
     -d '{"file":"dummuy_passwd", "username":"dummyuser", "password":"dummypassword2"}'\
     http://localhost/webadmin/api/ ; echo
curl -X PUT -u webadmin:webpass \
     -H "Content-Type: application/json" \
     -d '{"file":"dummuy_passwd", "username":"dummyuser2", "comment":"dummycomment2"}'\
     http://localhost/webadmin/api/ ; echo
echo ■ curl http://localhost/webadmin/api/ -u webadmin:webpass
curl http://localhost/webadmin/api/ -u webadmin:webpass ; echo
echo ■ curl -X DELETE http://localhost/webadmin/api/ -u webadmin:webpass
curl -X DELETE -u webadmin:webpass \
     -H "Content-Type: application/json" \
     -d '{"file":"dummuy_passwd", "username":"dummyuser"}'\
     http://localhost/webadmin/api/ ; echo
curl -X DELETE -u webadmin:webpass \
     -H "Content-Type: application/json" \
     -d '{"file":"dummuy_passwd", "username":"dummyuser2"}'\
     http://localhost/webadmin/api/ ; echo
echo ■■ 401 Authorization Required case
echo ■ curl http://localhost/webadmin/
curl http://localhost/webadmin/
echo ■ curl http://localhost/webadmin/api/
curl http://localhost/webadmin/api/
echo ■ curl -X POST http://localhost/webadmin/api/
curl -X POST http://localhost/webadmin/api/
echo ■■ 404 Not Found case
echo ■ curl -X POST http://localhost/webadmin/ -u webadmin:webpass
curl -X POST http://localhost/webadmin/ -u webadmin:webpass

echo
echo ■■■ curl http://localhost/sysadmin/
echo ■■ success case
echo ■■ error case
curl http://localhost/sysadmin/
echo ■ curl http://localhost/sysadmin/ -u sysadmin:syspass
curl http://localhost/sysadmin/ -u sysadmin:syspass
