async function getAllUsers(req, res) {
  try {
    const users = await req.db.all('SELECT id, username, email, role, help_score, created_at, is_blocked FROM Users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function toggleBlockUser(req, res) {
  try {
    const userId = req.params.id;
    const user = await req.db.get('SELECT is_blocked FROM Users WHERE id = ?', [userId]);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const newStatus = user.is_blocked ? 0 : 1;
    await req.db.run('UPDATE Users SET is_blocked = ? WHERE id = ?', [newStatus, userId]);
    
    res.json({ message: newStatus ? '使用者已封鎖' : '已解除封鎖' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteUser(req, res) {
  try {
    await req.db.run('BEGIN TRANSACTION');
    const userId = req.params.id;
    await req.db.run('DELETE FROM User_Tags WHERE user_id = ?', [userId]);
    await req.db.run('DELETE FROM Wishlists WHERE user_id = ?', [userId]);
    await req.db.run('DELETE FROM Messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
    await req.db.run('DELETE FROM Users WHERE id = ?', [userId]);
    await req.db.run('COMMIT');
    res.json({ message: '使用者已刪除' });
  } catch (error) {
    try { await req.db.run('ROLLBACK'); } catch (e) {}
    res.status(400).json({ message: '無法刪除該使用者，可能尚有關聯的商品或訂單紀錄。' });
  }
}

async function getAllProducts(req, res) {
  try {
    const products = await req.db.all(`
      SELECT p.*, u.username as seller_name 
      FROM Products p 
      JOIN Users u ON p.seller_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteProduct(req, res) {
  try {
    const productId = req.params.id;
    await req.db.run('BEGIN TRANSACTION');
    await req.db.run('DELETE FROM Product_Tags WHERE product_id = ?', [productId]);
    await req.db.run('DELETE FROM Wishlists WHERE product_id = ?', [productId]);
    await req.db.run('DELETE FROM Order_Items WHERE product_id = ?', [productId]);
    await req.db.run('DELETE FROM Products WHERE id = ?', [productId]);
    await req.db.run('COMMIT');
    res.json({ message: '商品已下架並刪除' });
  } catch (error) {
    try { await req.db.run('ROLLBACK'); } catch (e) {}
    res.status(500).json({ message: 'Server error' });
  }
}

async function getAllSOS(req, res) {
  try {
    const sos = await req.db.all(`
      SELECT s.*, u.username 
      FROM SOS_Requests s 
      JOIN Users u ON s.user_id = u.id 
      ORDER BY s.created_at DESC
    `);
    res.json(sos);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteSOS(req, res) {
  try {
    await req.db.run('DELETE FROM SOS_Requests WHERE id = ?', [req.params.id]);
    res.json({ message: '求救貼文已刪除' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getAllUsers, toggleBlockUser, deleteUser, getAllProducts, deleteProduct, getAllSOS, deleteSOS };
