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
    file_id       serial PRIMARY KEY,
    key_id        integer REFERENCES cacert (file_name) ON DELETE CASCADE ON UPDATE CASCADE,
    root_id       integer REFERENCES cacert (file_name) ON DELETE CASCADE ON UPDATE CASCADE,
    file_name     varchar(128),
    data_type     varchar(32),
    prikey_entity bytea,
    pubkey_entity bytea,
    cert_entity   bytea,
    comment       text
);
