import express from 'express';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'; // Import the cors package
import dotenv from 'dotenv'; // Import dotenv package

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Serve Adminer
app.get('/adminer', (req, res) => {
  res.sendFile(path.resolve('server/adminer.php'));
});

// Create a connection to the database
let connection; // Declare connection in a broader scope

async function initializeDatabase() {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST, // Use environment variable
      user: process.env.DB_USER, // Use environment variable
      password: process.env.DB_PASSWORD, // Use environment variable
    });

    // Create the test_db database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS test_db;');
    await connection.changeUser({ database: process.env.DB_NAME }); // Use environment variable

    // Create the pins table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS pins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        x INT NOT NULL,
        y INT NOT NULL,
        comments JSON,
        files JSON,
        completed BOOLEAN NOT NULL,
        pinNumber INT NOT NULL
      );
    `;
    await connection.query(createTableQuery);
    console.log('Pins table created or already exists.'); // Log success message
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1); // Exit the process if the connection fails
  }
}

// Initialize the database connection
await initializeDatabase();

// Route to get all pins
app.get('/pins', async (req, res) => {
  const [rows] = await connection.execute('SELECT * FROM pins');
  res.json(rows);
});

// Route to create a new pin
app.post('/pins', async (req, res) => {
  const { x, y, comments, files, completed, pinNumber } = req.body; // Exclude id
  console.log('Creating pin with values:', { x, y, comments, files, completed, pinNumber }); // Log values
  const query = 'INSERT INTO pins (x, y, comments, files, completed, pinNumber) VALUES (?, ?, ?, ?, ?, ?)';
  
  try {
    const result = await connection.execute(query, [x, y, JSON.stringify(comments), JSON.stringify(files), completed, pinNumber]);
    console.log('Pin created with ID:', result[0].insertId); // Log created pin ID
    res.status(201).json({ id: result[0].insertId, x, y, comments, files, completed, pinNumber }); // Return created pin
  } catch (error) {
    console.error('Error creating pin:', error.message);
    res.status(500).send('Error creating pin');
  }
});

// Route to update a pin
app.put('/pins/:id', async (req, res) => {
  const pinId = req.params.id;
  const updates = req.body;

  // Construct the update query dynamically
  const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const query = `UPDATE pins SET ${updateFields} WHERE id = ?`;
  
  try {
    await connection.execute(query, [...Object.values(updates), pinId]);
    res.send('Pin updated');
  } catch (error) {
    console.error('Error updating pin:', error.message);
    res.status(500).send('Error updating pin');
  }
});

// Route to delete a pin
app.delete('/pins/:id', async (req, res) => {
  const pinId = req.params.id;
  const query = 'DELETE FROM pins WHERE id = ?';
  await connection.execute(query, [pinId]);
  res.send('Pin deleted');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
