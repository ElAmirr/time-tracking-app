const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Create Express application
const app = express();

// Middleware
app.use(bodyParser.json());

const publicPath = path.join(__dirname, '../frontend/public');
app.use(express.static(publicPath));

// Hardcoded usernames and passwords
const users = [
  { username: 'operator', password: 'operator123', role: 'operator' },
  { username: 'admin', password: 'admin123', role: 'admin' }
];

// UI route for login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(publicPath, 'login.html'));
});

app.get('/operator_dashboard', (req, res) => {
    res.sendFile(path.join(publicPath, 'operator_dashboard.html'));
})

app.get('/admin_dashboard', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin_dashboard.html'));
})


// Authentication route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username && user.password === password);
  if (user) {
    res.json({ success: true, message: 'Login successful', role: user.role });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// Production recording route
app.post('/production', (req, res) => {
  const { machineId, unitsProduced } = req.body;
  // Perform production recording logic here
  res.json({ success: true, message: 'Production recorded successfully' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
