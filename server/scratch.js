const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
async function run() {
  const db = await open({ filename: path.resolve(__dirname, 'database.sqlite'), driver: sqlite3.Database });
  try {
    await db.exec('ALTER TABLE Users ADD COLUMN is_blocked BOOLEAN DEFAULT 0;');
    console.log('Added is_blocked column successfully');
  } catch(e) {
    console.log('Column might already exist:', e.message);
  }
}
run();
