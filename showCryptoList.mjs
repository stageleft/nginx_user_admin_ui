// usage: node showCryptoList.mjs
import * as crypto from 'node:crypto';

console.log("Ciphers............................................................");
//console.log(crypto.getCiphers());
console.log(crypto.getCiphers().filter((x) => x.indexOf('aes') == 0));
console.log(crypto.getCiphers().filter((x) => x.indexOf('aria') == 0));
console.log(crypto.getCiphers().filter((x) => x.indexOf('bf') == 0 || x.indexOf('blowfish') == 0));
console.log(crypto.getCiphers().filter((x) => x.indexOf('camellia') == 0));
console.log(crypto.getCiphers().filter((x) => x.indexOf('cast') == 0));
console.log(crypto.getCiphers().filter((x) => x.indexOf('chacha20') == 0));
console.log(crypto.getCiphers().filter((x) => x.indexOf('des') == 0));
console.log(crypto.getCiphers().filter((x) => x.indexOf('id') == 0));
console.log(crypto.getCiphers().filter((x) => x.indexOf('rc') == 0));
console.log(crypto.getCiphers().filter((x) => x.indexOf('seed') == 0));
console.log(crypto.getCiphers().filter((x) => x.indexOf('sm4') == 0));

console.log("Curves............................................................");
console.log(crypto.getCurves());

console.log("Hashes............................................................");
console.log(crypto.getHashes());
