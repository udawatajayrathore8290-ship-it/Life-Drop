const express = require('express');
const mysql2 = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const db = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.log('❌ MySQL connection failed:', err.message);
    return;
  }
  console.log('✅ MySQL connected successfully!');
  connection.release();
});

// ---- ROUTES ----

app.get('/', (req, res) => {
  res.json({ message: 'LifeDrop Backend is running! 🩸' });
});

app.get('/api/donors', (req, res) => {
  db.query('SELECT * FROM donors', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/donors/register', (req, res) => {
  const { name, blood_group, city, contact, password, last_donation_date } = req.body;
  const sql = `INSERT INTO donors (name, blood_group, city, contact, password, last_donation_date, available) 
               VALUES (?, ?, ?, ?, ?, ?, true)`;
  db.query(sql, [name, blood_group, city, contact, password, last_donation_date || null], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Donor registered!', id: result.insertId });
  });
});

app.post('/api/donors/login', (req, res) => {
  const { contact, password } = req.body;
  db.query('SELECT * FROM donors WHERE contact = ?', [contact], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Donor not found' });
    const donor = results[0];
    if (donor.password !== password) return res.status(401).json({ error: 'Incorrect password' });
    res.json({ message: 'Login successful', donor });
  });
});

app.put('/api/donors/:id/availability', (req, res) => {
  const { available } = req.body;
  db.query('UPDATE donors SET available = ? WHERE id = ?', [available, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Availability updated!' });
  });
});

app.put('/api/donors/:id/profile', (req, res) => {
  const { name, blood_group, city, contact, last_donation_date } = req.body;
  const sql = `UPDATE donors SET name=?, blood_group=?, city=?, contact=?, last_donation_date=? WHERE id=?`;
  db.query(sql, [name, blood_group, city, contact, last_donation_date || null, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Profile updated!' });
  });
});

app.get('/api/bloodbanks', (req, res) => {
  const sql = `SELECT bb.*, bbs.blood_group, bbs.units 
               FROM blood_banks bb 
               LEFT JOIN blood_bank_stock bbs ON bb.id = bbs.bank_id`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/bloodbanks/register', (req, res) => {
  const { name, city, contact, password } = req.body;
  db.query('INSERT INTO blood_banks (name, city, contact, password) VALUES (?, ?, ?, ?)',
    [name, city, contact, password], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const bankId = result.insertId;
      const groups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
      const stockValues = groups.map(g => [bankId, g, 0]);
      db.query('INSERT INTO blood_bank_stock (bank_id, blood_group, units) VALUES ?',
        [stockValues], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ message: 'Blood bank registered!', id: bankId });
        });
    });
});

app.post('/api/bloodbanks/login', (req, res) => {
  const { contact, password } = req.body;
  db.query('SELECT * FROM blood_banks WHERE contact = ?', [contact], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Blood bank not found' });
    const bank = results[0];
    if (bank.password !== password) return res.status(401).json({ error: 'Incorrect password' });
    res.json({ message: 'Login successful', bank });
  });
});

app.put('/api/bloodbanks/:id/stock', (req, res) => {
  const { blood_group, units } = req.body;
  db.query('UPDATE blood_bank_stock SET units = ? WHERE bank_id = ? AND blood_group = ?',
    [units, req.params.id, blood_group], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Stock updated!' });
    });
});

app.get('/api/bloodbanks/:id/stock', (req, res) => {
  db.query(
    'SELECT blood_group, units FROM blood_bank_stock WHERE bank_id = ?',
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

app.get('/api/search', (req, res) => {
  const { group, city, emergency } = req.query;

  let donorSql = 'SELECT * FROM donors WHERE 1=1';
  let donorParams = [];

  if (city) { donorSql += ' AND city = ?'; donorParams.push(city); }
  if (group) { donorSql += ' AND blood_group = ?'; donorParams.push(group); }
  if (emergency !== 'true') { donorSql += ' AND available = true'; }

  let bankSql = `SELECT bb.*, bbs.blood_group, bbs.units 
                 FROM blood_banks bb 
                 JOIN blood_bank_stock bbs ON bb.id = bbs.bank_id 
                 WHERE bbs.units > 0`;
  let bankParams = [];

  if (city) { bankSql += ' AND bb.city = ?'; bankParams.push(city); }
  if (group) { bankSql += ' AND bbs.blood_group = ?'; bankParams.push(group); }

  db.query(donorSql, donorParams, (err, donors) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(bankSql, bankParams, (err2, banks) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ donors, banks });
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 LifeDrop server running on http://localhost:${PORT}`);
});