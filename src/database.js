import mysql from 'mysql2/promise';

// Create a connection to the database
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '', // Replace with your MySQL password
  database: 'admin' // Replace with your MySQL database name
});

// Function to save a pin to the database
export const savePin = async (pin) => {
  const query = 'INSERT INTO pins (id, x, y, comments, files, completed, pinNumber) VALUES (?, ?, ?, ?, ?, ?, ?)';
  await connection.execute(query, [pin.id, pin.x, pin.y, JSON.stringify(pin.comments), JSON.stringify(pin.files), pin.completed, pin.pinNumber]);
};

// Function to get all pins from the database
export const getPins = async () => {
  const [rows] = await connection.execute('SELECT * FROM pins');
  return rows.map(row => ({
    id: row.id,
    x: row.x,
    y: row.y,
    comments: JSON.parse(row.comments),
    files: JSON.parse(row.files),
    completed: row.completed,
    pinNumber: row.pinNumber
  }));
};

// Function to update a pin in the database
export const updatePin = async (pinId, updates) => {
  const query = 'UPDATE pins SET ? WHERE id = ?';
  await connection.execute(query, [updates, pinId]);
};

// Function to delete a pin from the database
export const deletePin = async (pinId) => {
  const query = 'DELETE FROM pins WHERE id = ?';
  await connection.execute(query, [pinId]);
};
