const bcrypt = require('bcryptjs');
const { generateToken } = require('../middlewares/auth');

async function register(req, res) {
  const { username, password, email } = req.body;
  
  if (!email || !email.endsWith('@o365.fcu.edu.tw')) {
    return res.status(400).json({ message: '信箱結尾必須為 @o365.fcu.edu.tw 才能進行註冊' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const role = username === 'admin' ? 'admin' : 'user';
    const result = await req.db.run(
      'INSERT INTO Users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, passwordHash, email, role]
    );
    const user = { id: result.lastID, username, email, role };
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  try {
    const user = await req.db.get('SELECT * FROM Users WHERE username = ?', [username]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.is_blocked) {
      return res.status(403).json({ message: '您的帳號已被封鎖，無法登入' });
    }

    const token = generateToken(user);
    res.json({ user: { id: user.id, username: user.username, email: user.email, help_score: user.help_score, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function getProfile(req, res) {
  try {
    const user = await req.db.get('SELECT id, username, email, contact_info, help_score, role, created_at FROM Users WHERE id = ?', [req.user.id]);
    
    const tags = await req.db.all(`
      SELECT t.name FROM Tags t
      JOIN User_Tags ut ON t.id = ut.tag_id
      WHERE ut.user_id = ?
    `, [req.user.id]);
    user.tags = tags.map(t => t.name);

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function getDashboard(req, res) {
  try {
    // Buyer perspective: My orders
    const myOrders = await req.db.all(`
      SELECT o.*, oi.price_at_buy, oi.deposit_at_buy, p.title, p.image_url, p.type 
      FROM Orders o
      JOIN Order_Items oi ON o.id = oi.order_id
      JOIN Products p ON oi.product_id = p.id
      WHERE o.buyer_id = ?
    `, [req.user.id]);

    // Seller perspective: My products
    const myProducts = await req.db.all(`
      SELECT p.*, o.id as order_id, o.status as order_status, o.recipient_name, o.recipient_phone, o.recipient_address, o.delivery_method, u.username as buyer_username
      FROM Products p
      LEFT JOIN Order_Items oi ON p.id = oi.product_id
      LEFT JOIN Orders o ON oi.order_id = o.id AND o.status IN ('pending', 'shipped')
      LEFT JOIN Users u ON o.buyer_id = u.id
      WHERE p.seller_id = ? AND (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `, [req.user.id]);

    // My wishlist
    const myWishlist = await req.db.all(`
      SELECT p.* 
      FROM Wishlists w
      JOIN Products p ON w.product_id = p.id
      WHERE w.user_id = ? AND (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `, [req.user.id]);

    res.json({ myOrders, myProducts, myWishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateProfile(req, res) {
  const { email, currentPassword, newPassword, tags, contact_info } = req.body;
  
  try {
    await req.db.run('BEGIN TRANSACTION');
    const user = await req.db.get('SELECT * FROM Users WHERE id = ?', [req.user.id]);
    
    if (currentPassword && newPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) throw new Error('Invalid current password');
      
      const newHash = await bcrypt.hash(newPassword, 10);
      await req.db.run('UPDATE Users SET email = ?, password = ?, contact_info = ? WHERE id = ?', [email, newHash, contact_info, req.user.id]);
    } else {
      await req.db.run('UPDATE Users SET email = ?, contact_info = ? WHERE id = ?', [email, contact_info, req.user.id]);
    }
    
    if (tags && Array.isArray(tags)) {
      await req.db.run('DELETE FROM User_Tags WHERE user_id = ?', [req.user.id]);
      for (const tagName of tags) {
        let tag = await req.db.get('SELECT id FROM Tags WHERE name = ?', [tagName]);
        if (!tag) {
          const tagResult = await req.db.run('INSERT INTO Tags (name) VALUES (?)', [tagName]);
          tag = { id: tagResult.lastID };
        }
        await req.db.run('INSERT INTO User_Tags (user_id, tag_id) VALUES (?, ?)', [req.user.id, tag.id]);
      }
    }
    
    await req.db.run('COMMIT');
    res.json({ message: 'Profile updated' });
  } catch (error) {
    try { await req.db.run('ROLLBACK'); } catch (e) {}
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    if (error.message === 'Invalid current password') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

async function getLeaderboard(req, res) {
  try {
    const { search } = req.query;
    let query = 'SELECT id, username, help_score, contact_info FROM Users';
    const params = [];
    
    if (search) {
      query += ' WHERE username LIKE ?';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY help_score DESC, username ASC';
    
    const users = await req.db.all(query, params);
    
    for (let u of users) {
      const tags = await req.db.all(`
        SELECT t.name FROM Tags t
        JOIN User_Tags ut ON t.id = ut.tag_id
        WHERE ut.user_id = ?
      `, [u.id]);
      u.tags = tags.map(t => t.name);
    }
    
    res.json(users);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login, getProfile, getDashboard, updateProfile, getLeaderboard };
