async function toggleWishlist(req, res) {
  const { product_id } = req.body;
  const user_id = req.user.id;

  try {
    const exists = await req.db.get('SELECT * FROM Wishlists WHERE user_id = ? AND product_id = ?', [user_id, product_id]);
    
    if (exists) {
      await req.db.run('DELETE FROM Wishlists WHERE user_id = ? AND product_id = ?', [user_id, product_id]);
      return res.json({ message: 'Removed from wishlist', added: false });
    } else {
      await req.db.run('INSERT INTO Wishlists (user_id, product_id) VALUES (?, ?)', [user_id, product_id]);
      return res.json({ message: 'Added to wishlist', added: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function getSOSRequests(req, res) {
  try {
    const { search } = req.query;
    let query = `
      SELECT s.*, u.username as requester_name
      FROM SOS_Requests s
      JOIN Users u ON s.user_id = u.id
    `;
    const params = [];
    
    if (search) {
      query += ` WHERE s.title LIKE ? OR s.description LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY s.created_at DESC`;
    const requests = await req.db.all(query, params);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function createSOSRequest(req, res) {
  const { title, description } = req.body;
  const user_id = req.user.id;

  try {
    const result = await req.db.run(`
      INSERT INTO SOS_Requests (user_id, title, description)
      VALUES (?, ?, ?)
    `, [user_id, title, description]);
    res.status(201).json({ message: 'SOS Request created', id: result.lastID });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function returnRental(req, res) {
  const { order_id, product_id, help_score_given } = req.body;
  const buyer_id = req.user.id;

  try {
    await req.db.run('BEGIN TRANSACTION');

    // Verify order and ownership
    const order = await req.db.get('SELECT * FROM Orders WHERE id = ? AND buyer_id = ?', [order_id, buyer_id]);
    if (!order) throw new Error('Order not found');

    const item = await req.db.get('SELECT * FROM Order_Items WHERE order_id = ? AND product_id = ?', [order_id, product_id]);
    if (!item) throw new Error('Item not found in order');

    const product = await req.db.get('SELECT * FROM Products WHERE id = ?', [product_id]);
    if (product.type !== 'rent') throw new Error('Product is not for rent');

    // Update product status back to available
    await req.db.run('UPDATE Products SET status = ? WHERE id = ?', ['available', product_id]);

    // Give help score to the seller
    if (help_score_given && help_score_given > 0) {
      await req.db.run('UPDATE Users SET help_score = help_score + ? WHERE id = ?', [help_score_given, product.seller_id]);
    }

    await req.db.run('COMMIT');
    res.json({ message: 'Rental returned successfully' });
  } catch (error) {
    await req.db.run('ROLLBACK');
    res.status(400).json({ message: error.message || 'Server error' });
  }
}

async function updateSOSRequestStatus(req, res) {
  const { id } = req.params;
  const { status, helper_username, help_score_given } = req.body;
  const user_id = req.user.id;

  try {
    const sosRequest = await req.db.get('SELECT * FROM SOS_Requests WHERE id = ? AND user_id = ?', [id, user_id]);
    if (!sosRequest) {
      return res.status(404).json({ message: 'SOS request not found or unauthorized' });
    }

    if (status === 'withdrawn') {
      await req.db.run('DELETE FROM SOS_Requests WHERE id = ?', [id]);
      return res.json({ message: 'SOS Request withdrawn successfully' });
    } else if (status === 'resolved') {
      await req.db.run('BEGIN TRANSACTION');
      
      await req.db.run('UPDATE SOS_Requests SET status = ? WHERE id = ?', ['resolved', id]);

      if (helper_username && help_score_given && help_score_given > 0) {
        // Find helper by username
        const helper = await req.db.get('SELECT id FROM Users WHERE username = ?', [helper_username]);
        if (helper && helper.id !== user_id) {
          await req.db.run('UPDATE Users SET help_score = help_score + ? WHERE id = ?', [help_score_given, helper.id]);
        }
      }

      await req.db.run('COMMIT');
      return res.json({ message: 'SOS Request resolved successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid status' });
    }
  } catch (error) {
    if (req.db.inTransaction) {
      await req.db.run('ROLLBACK');
    }
    res.status(500).json({ message: 'Server error' });
  }
}

async function checkWishlist(req, res) {
  const { product_id } = req.params;
  const user_id = req.user.id;

  try {
    const exists = await req.db.get('SELECT * FROM Wishlists WHERE user_id = ? AND product_id = ?', [user_id, product_id]);
    res.json({ wishlisted: !!exists });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { toggleWishlist, getSOSRequests, createSOSRequest, returnRental, updateSOSRequestStatus, checkWishlist };
