const bcrypt = require('bcryptjs');

async function seedData(db) {
  // Check if users already exist to avoid seeding multiple times
  const userCount = await db.get('SELECT COUNT(*) as count FROM Users');
  if (userCount.count > 0) {
    console.log('Database already seeded. Skipping seed process.');
    return;
  }

  console.log('Seeding mock data...');

  // 1. Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    ['john_doe', passwordHash, 'john@example.com', 5],
    ['jane_smith', passwordHash, 'jane@example.com', 12],
    ['campus_hero', passwordHash, 'hero@example.com', 25]
  ];

  for (const user of users) {
    await db.run('INSERT INTO Users (username, password, email, help_score) VALUES (?, ?, ?, ?)', user);
  }

  // 2. Tags
  const tags = ['資工系', '資料結構', '微積分', '設計系', '實驗器材', '教科書', '電子用品'];
  for (const tag of tags) {
    await db.run('INSERT INTO Tags (name) VALUES (?)', tag);
  }

  // 3. Products
  const products = [
    [1, '資料結構與演算法 (原文書)', '近乎全新，無筆記', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600', 'sell', 800, 0, 'available'],
    [2, 'CASIO FX-991EX 工程計算機', '微積分與工程數學必備', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&q=80&w=600', 'rent', 50, 300, 'available'],
    [3, '普通物理實驗衣 (M號)', '洗得很乾淨', 'https://images.unsplash.com/photo-1584844695955-442436d6a59b?auto=format&fit=crop&q=80&w=600', 'rent', 20, 100, 'available'],
    [1, '設計系專用 麥克筆 72色', '僅用過幾次', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600', 'sell', 1500, 0, 'available']
  ];

  for (const prod of products) {
    await db.run(`INSERT INTO Products (seller_id, title, description, image_url, type, price, deposit, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, prod);
  }

  // 4. Product Tags Mapping
  // Tag IDs: 1:資工系, 2:資料結構, 3:微積分, 4:設計系, 5:實驗器材, 6:教科書, 7:電子用品
  const productTags = [
    [1, 1], [1, 2], [1, 6], // 資料結構書 -> 資工系, 資料結構, 教科書
    [2, 3], [2, 7], // 計算機 -> 微積分, 電子用品
    [3, 5], // 實驗衣 -> 實驗器材
    [4, 4] // 麥克筆 -> 設計系
  ];

  for (const pt of productTags) {
    await db.run('INSERT INTO Product_Tags (product_id, tag_id) VALUES (?, ?)', pt);
  }

  // 5. SOS Requests
  const sosRequests = [
    [2, '急借 明天普物實驗的護目鏡', '有沒有好心人可以借一下？明早8點綜合大樓面交！', 'open'],
    [1, '徵求 離散數學 考古題', '下週要期中考了，求前輩支援', 'resolved']
  ];

  for (const sos of sosRequests) {
    await db.run('INSERT INTO SOS_Requests (user_id, title, description, status) VALUES (?, ?, ?, ?)', sos);
  }

  console.log('Mock data seeded successfully.');
}

module.exports = { seedData };
