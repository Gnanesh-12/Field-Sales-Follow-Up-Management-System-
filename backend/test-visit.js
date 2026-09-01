const http = require('http');

const data = JSON.stringify({
  employeeId: 'se-fs-001',
  pin: 'password123'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const token = JSON.parse(body).access_token;
    console.log("Token:", token);

    const visitData = JSON.stringify({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
      customerSiteName: 'Test Site',
      notes: 'Test Notes',
      remarks: 'Test Remarks',
      lat: 12.9716,
      lng: 77.5946,
      accuracy: 10,
      imageUrl: '/uploads/test.jpg',
      materials: null,
      followUp: { notes: 'Task', dueDate: '2026-09-08' }
    });

    const visitReq = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/employees/me/visits',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': visitData.length
      }
    }, vRes => {
      let vBody = '';
      vRes.on('data', d => vBody += d);
      vRes.on('end', () => {
        console.log("Response:", vRes.statusCode, vBody);
      });
    });

    visitReq.on('error', e => console.error(e));
    visitReq.write(visitData);
    visitReq.end();
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
