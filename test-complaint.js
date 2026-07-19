const http = require('http');

const data = JSON.stringify({
    customerId: "c487c2f4-547a-4a89-825d-390269eb5449",
    reason: "test",
    description: "test"
});

const req = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/orders/35/complaints',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('RESPONSE:', res.statusCode, body));
});

req.on('error', e => console.error('ERROR:', e.message));
req.write(data);
req.end();
