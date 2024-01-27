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
INSERT INTO userfile (file, username, password, comment) VALUES ('webadmin_passwd', 'webadmin', 'webpass', 'system default.');
INSERT INTO userfile (file, username, password, comment) VALUES ('webadmin_passwd', 'certadmin', 'certpass', 'same as /certadmin/ dir.');
INSERT INTO userfile (file, username, password) VALUES ('certadmin_passwd', 'certadmin', 'certpass');
-- Table and sample data for certificate (both CA-signed and self-signed).
CREATE TABLE certfiles(
    file_id       serial PRIMARY KEY,
    key_id        integer REFERENCES certfiles (file_id) ON DELETE CASCADE ON UPDATE CASCADE,
    root_id       integer REFERENCES certfiles (file_id) ON DELETE CASCADE ON UPDATE CASCADE,
    data_type     varchar(32) NOT NULL,
    file_name     varchar(128),
    prikey_entity bytea,
    pubkey_entity bytea,
    cert_entity   bytea,
    comment       text
);
INSERT INTO certfiles (data_type, file_name) VALUES ('keypair', 'dummy_ca.example.com'); -- file_id=1
INSERT INTO certfiles (key_id, data_type, file_name) VALUES ('1', 'root_selfca', 'dummy_ca.example.com'); -- file_id=2
INSERT INTO certfiles (data_type, file_name) VALUES ('keypair', 'localhost'); -- file_id=3
INSERT INTO certfiles (key_id, root_id, data_type, file_name) VALUES ('3','2', 'selfcert', 'localhost'); -- file_id=4
UPDATE certfiles SET prikey_entity = pg_read_binary_file('/docker-entrypoint-initdb.d/dummy_ca.example.com.key') where file_id = '1';
UPDATE certfiles SET pubkey_entity = pg_read_binary_file('/docker-entrypoint-initdb.d/dummy_ca.example.com.csr') where file_id = '1';
UPDATE certfiles SET comment = 'CSR: C = JP, ST = Tokyo, L = TokyoCity, O = MyCompany, OU = MyDivision, CN = dummy_ca.example.com, emailAddress = email@example.com' where file_id = '1';
UPDATE certfiles SET cert_entity = pg_read_binary_file('/docker-entrypoint-initdb.d/dummy_ca.example.com.crt') where file_id = '2';
UPDATE certfiles SET comment = 'expires 2025-02-23' where file_id = '2';
UPDATE certfiles SET prikey_entity = pg_read_binary_file('/docker-entrypoint-initdb.d/localhost.key') where file_id = '3';
UPDATE certfiles SET pubkey_entity = pg_read_binary_file('/docker-entrypoint-initdb.d/localhost.csr') where file_id = '3';
UPDATE certfiles SET comment = 'CSR: C = JP, ST = Tokyo, L = TokyoCity, O = MyCompany, OU = MyDivision, CN = localhost, emailAddress = email@example.com' where file_id = '3';
UPDATE certfiles SET cert_entity = pg_read_binary_file('/docker-entrypoint-initdb.d/localhost.crt') where file_id = '4';
UPDATE certfiles SET comment = 'expires 2024-08-27' where file_id = '4';
CREATE TABLE certfiles_deploy_history(
    file_id       integer PRIMARY KEY REFERENCES certfiles (file_id) ON DELETE CASCADE ON UPDATE CASCADE,
    deploy_date   timestamp (0) with time zone
);
INSERT INTO certfiles_deploy_history (file_id, deploy_date) VALUES ('4', CURRENT_TIMESTAMP(0));
