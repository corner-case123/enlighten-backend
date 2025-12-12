const dns = require('dns');

// Force using Google DNS
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('Set DNS servers to 8.8.8.8 and 8.8.4.4');
} catch (e) {
    console.error('Could not set DNS servers:', e.message);
}

const hostname = '_mongodb._tcp.enlighten.pdetu.mongodb.net';

console.log(`Attempting to resolve SRV record for: ${hostname}`);

dns.resolveSrv(hostname, (err, addresses) => {
    if (err) {
        console.error('DNS Resolution Error:', err);
        return;
    }
    console.log('SRV Records found:', addresses);
});
