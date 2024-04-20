const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Create Express application
const app = express();

// Middleware
app.use(bodyParser.json());

const publicPath = path.join(__dirname, '../frontend/public');
app.use(express.static(publicPath));

// Hardcoded usernames and passwords
const users = [
  { username: '1224', password: '12241224', role: 'operator'},
  { username: 'operator', password: 'operator123', role: 'operator' },
  { username: 'admin', password: 'admin123', role: 'admin' }
];

const databasePath = path.join(__dirname, 'database.db');
// SQLite database setup
const db = new sqlite3.Database(databasePath);

// Create table if not exists
db.run(`
    CREATE TABLE IF NOT EXISTS stoppage_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time_of_stop TEXT,
        duration TEXT,
        reason TEXT,
        custom_reason TEXT
    )
`);

// Insert data into the stoppage_log table
function insertStoppageLogEntry(entry) {
  db.run(`
      INSERT INTO stoppage_log (time_of_stop, duration, reason, custom_reason)
      VALUES (?, ?, ?, ?)
  `, [entry.timeOfStop, entry.duration, entry.reason, entry.customReasonText], (err) => {
      if (err) {
          console.error(err.message);
      } else {
          console.log('Data inserted into stoppage_log table.');
      }
  });
}

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
    res.json({ success: true, message: 'Login successful', username: user.username, role: user.role });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// Route to receive stoppage data and insert into the database
app.post('/logStoppage', (req, res) => {
  const entry = req.body;
  insertStoppageLogEntry(entry);
  res.json({ success: true, message: 'Stoppage data logged successfully' });
})

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
