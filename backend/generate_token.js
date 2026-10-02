const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
  { sub: 'SE-FS-001', employeeId: 'SE-FS-001', role: 'EMPLOYEE' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

console.log(token);
