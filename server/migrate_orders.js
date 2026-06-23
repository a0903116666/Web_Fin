const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function migrate() {
  const db = await open({
    filename: path.resolve(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  console.log("Starting migration...");
  
  await db.run('PRAGMA foreign_keys = OFF;');
  
  await db.run('BEGIN TRANSACTION');

  try {
    await db.run('ALTER TABLE Orders RENAME TO Orders_Old;');
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        deposit_amount INTEGER DEFAULT 0,
        delivery_method TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        recipient_phone TEXT NOT NULL,
        recipient_address TEXT NOT NULL,
        status TEXT CHECK(status IN ('pending', 'shipped', 'completed', 'cancelled', 'returned')) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(buyer_id) REFERENCES Users(id)
      );
    `);

    await db.run('INSERT INTO Orders SELECT * FROM Orders_Old;');
    await db.run('DROP TABLE Orders_Old;');
    
    await db.run('COMMIT');
    console.log("Migration completed successfully.");
  } catch (err) {
    await db.run('ROLLBACK');
    console.error("Migration failed:", err);
  } finally {
    await db.run('PRAGMA foreign_keys = ON;');
  }
}

migrate().catch(console.error);
