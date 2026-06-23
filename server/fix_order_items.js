const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function fixOrderItems() {
  const db = await open({
    filename: path.resolve(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.run('PRAGMA foreign_keys = OFF;');
  await db.run('BEGIN TRANSACTION');

  try {
    await db.run('ALTER TABLE Order_Items RENAME TO Order_Items_Old;');
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Order_Items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        price_at_buy INTEGER NOT NULL,
        deposit_at_buy INTEGER DEFAULT 0,
        FOREIGN KEY(order_id) REFERENCES Orders(id),
        FOREIGN KEY(product_id) REFERENCES Products(id)
      );
    `);

    await db.run('INSERT INTO Order_Items SELECT * FROM Order_Items_Old;');
    await db.run('DROP TABLE Order_Items_Old;');
    
    await db.run('COMMIT');
    console.log("Fixed Order_Items foreign keys!");
  } catch (err) {
    await db.run('ROLLBACK');
    console.error("Failed:", err);
  } finally {
    await db.run('PRAGMA foreign_keys = ON;');
  }
}

fixOrderItems().catch(console.error);
