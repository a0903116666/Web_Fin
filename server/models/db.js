const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');

async function connectDB() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await setupSchema(db);
  return db;
}

async function setupSchema(db) {
  // Turn on foreign key constraints
  await db.run('PRAGMA foreign_keys = ON;');

  // Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      contact_info TEXT,
      help_score INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user',
      is_blocked BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await db.exec(`ALTER TABLE Users ADD COLUMN contact_info TEXT;`);
  } catch (e) {
    // Column already exists
  }

  try {
    await db.exec(`ALTER TABLE Users ADD COLUMN role TEXT DEFAULT 'user';`);
  } catch (e) {
    // Column already exists
  }

  // Products Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      type TEXT CHECK(type IN ('rent', 'sell')) NOT NULL,
      price INTEGER NOT NULL,
      deposit INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('available', 'rented', 'sold')) DEFAULT 'available',
      is_deleted BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(seller_id) REFERENCES Users(id)
    );
  `);

  // Orders Table
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

  // Order_Items Table
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

  // Tags Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  // Product_Tags Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Product_Tags (
      product_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (product_id, tag_id),
      FOREIGN KEY(product_id) REFERENCES Products(id),
      FOREIGN KEY(tag_id) REFERENCES Tags(id)
    );
  `);

  // Wishlists Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Wishlists (
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES Users(id),
      FOREIGN KEY(product_id) REFERENCES Products(id)
    );
  `);

  // SOS_Requests Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS SOS_Requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT CHECK(status IN ('open', 'resolved')) DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES Users(id)
    );
  `);

  // Messages Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sender_id) REFERENCES Users(id),
      FOREIGN KEY(receiver_id) REFERENCES Users(id)
    );
  `);

  // User_Tags Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS User_Tags (
      user_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, tag_id),
      FOREIGN KEY(user_id) REFERENCES Users(id),
      FOREIGN KEY(tag_id) REFERENCES Tags(id)
    );
  `);

  console.log("Database schema initialized.");
}

module.exports = { connectDB };
