async function getAllProducts(req, res) {
  try {
    const { type, tag, search, user_tag } = req.query;
    let query = `
      SELECT p.*, u.username as seller_name, u.help_score, u.contact_info
      FROM Products p
      JOIN Users u ON p.seller_id = u.id
      WHERE p.status = 'available' AND (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `;
    const params = [];

    if (type) {
      query += ` AND p.type = ?`;
      params.push(type);
    }
    
    if (search) {
      query += ` AND p.title LIKE ?`;
      params.push(`%${search}%`);
    }

    if (tag) {
      query += ` AND p.id IN (
        SELECT pt.product_id FROM Product_Tags pt
        JOIN Tags t ON pt.tag_id = t.id
        WHERE t.name = ?
      )`;
      params.push(tag);
    }

    if (user_tag) {
      query += ` AND u.id IN (
        SELECT ut.user_id FROM User_Tags ut
        JOIN Tags t ON ut.tag_id = t.id
        WHERE t.name = ?
      )`;
      params.push(user_tag);
    }

    query += ` ORDER BY p.created_at DESC`;

    const products = await req.db.all(query, params);

    // Fetch tags for each product
    for (let p of products) {
      const tags = await req.db.all(`
        SELECT t.name FROM Tags t
        JOIN Product_Tags pt ON t.id = pt.tag_id
        WHERE pt.product_id = ?
      `, [p.id]);
      p.tags = tags.map(t => t.name);
    }

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getProductById(req, res) {
  try {
    const product = await req.db.get(`
      SELECT p.*, u.username as seller_name, u.help_score, u.contact_info
      FROM Products p
      JOIN Users u ON p.seller_id = u.id
      WHERE p.id = ? AND (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `, [req.params.id]);

    if (!product) return res.status(404).json({ message: 'Product not found' });

    const tags = await req.db.all(`
      SELECT t.name FROM Tags t
      JOIN Product_Tags pt ON t.id = pt.tag_id
      WHERE pt.product_id = ?
    `, [product.id]);
    product.tags = tags.map(t => t.name);

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function createProduct(req, res) {
  const { title, description, image_url, type, price, deposit, tags } = req.body;
  const seller_id = req.user.id;

  try {
    await req.db.run('BEGIN TRANSACTION');

    const result = await req.db.run(`
      INSERT INTO Products (seller_id, title, description, image_url, type, price, deposit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [seller_id, title, description, image_url, type, price, deposit || 0]);

    const productId = result.lastID;

    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        // Find or create tag
        let tag = await req.db.get('SELECT id FROM Tags WHERE name = ?', [tagName]);
        if (!tag) {
          const tagResult = await req.db.run('INSERT INTO Tags (name) VALUES (?)', [tagName]);
          tag = { id: tagResult.lastID };
        }
        await req.db.run('INSERT INTO Product_Tags (product_id, tag_id) VALUES (?, ?)', [productId, tag.id]);
      }
    }

    await req.db.run('COMMIT');
    res.status(201).json({ message: 'Product created', productId });
  } catch (error) {
    await req.db.run('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getTags(req, res) {
  try {
    const tags = await req.db.all('SELECT * FROM Tags ORDER BY name ASC');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteProduct(req, res) {
  const productId = req.params.id;
  const sellerId = req.user.id;

  try {
    await req.db.run('BEGIN TRANSACTION');

    const product = await req.db.get('SELECT * FROM Products WHERE id = ? AND seller_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)', [productId, sellerId]);
    if (!product) {
      await req.db.run('ROLLBACK');
      return res.status(404).json({ message: '找不到該商品或無權限刪除' });
    }

    const pendingOrder = await req.db.get(`
      SELECT o.id FROM Order_Items oi
      JOIN Orders o ON oi.order_id = o.id
      WHERE oi.product_id = ? AND o.status = 'pending'
    `, [productId]);

    if (pendingOrder) {
      // User requested: Cancel the transaction
      await req.db.run('UPDATE Orders SET status = ? WHERE id = ?', ['cancelled', pendingOrder.id]);
    } else {
      if (product.status !== 'available') {
        await req.db.run('ROLLBACK');
        return res.status(400).json({ message: '無法刪除：該商品正在交易中或已完成交易' });
      }
    }

    // Soft delete
    await req.db.run('UPDATE Products SET is_deleted = 1 WHERE id = ?', [productId]);

    await req.db.run('COMMIT');
    res.json({ message: '商品已成功刪除' });
  } catch (error) {
    try { await req.db.run('ROLLBACK'); } catch (e) {}
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getAllProducts, getProductById, createProduct, getTags, deleteProduct };
