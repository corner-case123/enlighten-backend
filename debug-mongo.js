const dns = require('dns');

const hostname = '_mongodb._tcp.enlighten.pdetu.mongodb.net';

console.log(`Attempting to resolve SRV record for: ${hostname}`);

dns.resolveSrv(hostname, (err, addresses) => {
  if (err) {
    console.error('DNS Resolution Error:', err);
    return;
  }
  console.log('SRV Records found:', addresses);
});
