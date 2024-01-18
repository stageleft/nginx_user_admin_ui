-- Database
CREATE DATABASE settings_nginx;
\c settings_nginx;
-- Table and sample data for BASIC auth user admin.
CREATE TABLE userfile(
    file varchar(32),
    username varchar(128),
    password varchar(256),
    comment text
);
INSERT INTO userfile (file, username, password) VALUES ('webadmin_passwd', 'webadmin', 'webpass');
INSERT INTO userfile (file, username, password, comment) VALUES ('webadmin_passwd', 'sysadmin', 'syspass', 'same as /sysadmin/ dir.');
INSERT INTO userfile (file, username, password) VALUES ('sysadmin_passwd', 'sysadmin', 'syspass');
-- Table and sample data for certificate (both CA-signed and self-signed).
CREATE TABLE certfiles(
    file_name   varchar(128) PRIMARY KEY,
    data_type   varchar(32),
-- see. https://learn.microsoft.com/ja-jp/azure/application-gateway/self-signed-certificates
-- prikey: private key for cacert                                        by "openssl genrsa 2048 > prikey.key" or "openssl ecparam -out prikey.key -name prime256v1 -genkey"
-- pubkey: certificate signing request (public key) for cacert           by "openssl req -new -sha256 -key prikey.key -out pubkey.csr" 
-- cacert: public key certificate by purchase from CA using pubkey
-- root_prikey: private key for root_selfca                              by "openssl genrsa 2048 > root_prikey.key" or "openssl ecparam -out root_prikey.key -name prime256v1 -genkey"
-- root_pubkey: certificate signing request (public key) for root_selfca by "openssl req -new -sha256 -key root_prikey.key -out pubkey.csr" 
-- root_selfca: X.509 self-signed root certificate                       by "openssl x509 -req -sha256 -days 365 -in root_pubkey.csr -signkey root_prikey.key -out root_selfca.crt"
-- selfcert: public key certificate using root_selfca and pubkey         by "openssl x509 -req -in pubkey.csr -CA root_selfca.crt -CAkey root_prikey.key -CAcreateserial -out selfcert.crt -days 365 -sha256"
    input_file  varchar(128),
-- if prikey/root_prikey, set file_name itself
-- if pubkey, set file_name of prikey
-- if root_pubkey, set file_name of root_pubkey
-- if root_selfca, set file_name of root_pubkey
-- if cacert/selfcert, set file_name of pubkey. relation of selfcert - root_selfca is not treated. use comment if necessary.
    cert_entity bytea,
    comment     text,
-- TODO: set FOREIGN KEY.
--    FOREIGN KEY (input_file)
--        references cacert (file_name)
--        ON DELETE CASCADE
--        ON UPDATE CASCADE
);
