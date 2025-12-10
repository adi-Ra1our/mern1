const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello from test server'));
const srv = app.listen(5000, () => console.log('test-server listening on port 5000'));
srv.on('error', (err) => { console.error('test-server failed to listen:', err); process.exit(1); });
