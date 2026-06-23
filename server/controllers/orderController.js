async function createOrder(req, res) {
  const { items, delivery_method, recipient_name, recipient_phone, recipient_address } = req.body;
  const buyer_id = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in order' });
  }

  try {
    await req.db.run('BEGIN TRANSACTION');

    let total_amount = 0;
    let deposit_amount = 0;

    // 1. Check availability and calculate totals
    for (const item of items) {
      const product = await req.db.get('SELECT * FROM Products WHERE id = ?', [item.product_id]);
      if (!product || product.status !== 'available') {
        throw new Error(`Product ${item.product_id} is not available`);
      }
      total_amount += product.price;
      if (product.type === 'rent') {
        deposit_amount += product.deposit;
      }
    }

    // 2. Create Order record
    const result = await req.db.run(`
      INSERT INTO Orders (buyer_id, total_amount, deposit_amount, delivery_method, recipient_name, recipient_phone, recipient_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [buyer_id, total_amount, deposit_amount, delivery_method, recipient_name, recipient_phone, recipient_address]);

    const orderId = result.lastID;

    // 3. Create Order_Items and update Product status
    for (const item of items) {
      const product = await req.db.get('SELECT * FROM Products WHERE id = ?', [item.product_id]);
      
      await req.db.run(`
        INSERT INTO Order_Items (order_id, product_id, price_at_buy, deposit_at_buy)
        VALUES (?, ?, ?, ?)
      `, [orderId, product.id, product.price, product.type === 'rent' ? product.deposit : 0]);

      const newStatus = product.type === 'rent' ? 'rented' : 'sold';
      await req.db.run('UPDATE Products SET status = ? WHERE id = ?', [newStatus, product.id]);
    }

    await req.db.run('COMMIT');
    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (error) {
    await req.db.run('ROLLBACK');
    console.error(error);
    if (error.message.includes('not available')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during checkout' });
  }
}

async function processOrder(req, res) {
  const orderId = req.params.id;
  try {
    // Check if the order contains any product belonging to the seller
    const orderItems = await req.db.all(`
      SELECT p.seller_id FROM Order_Items oi
      JOIN Products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    if (orderItems.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isSeller = orderItems.some(item => item.seller_id === req.user.id);
    if (!isSeller) {
      return res.status(403).json({ message: 'Not authorized to process this order' });
    }

    const order = await req.db.get('SELECT * FROM Orders WHERE id = ?', [orderId]);
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be processed' });
    }

    await req.db.run('UPDATE Orders SET status = ? WHERE id = ?', ['shipped', orderId]);
    res.json({ message: 'Order marked as shipped' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while processing order' });
  }
}

async function completeOrder(req, res) {
  const orderId = req.params.id;
  const buyerId = req.user.id;
  try {
    const order = await req.db.get('SELECT * FROM Orders WHERE id = ? AND buyer_id = ?', [orderId, buyerId]);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({ message: 'Only shipped orders can be completed' });
    }

    await req.db.run('UPDATE Orders SET status = ? WHERE id = ?', ['completed', orderId]);
    res.json({ message: 'Order marked as completed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while completing order' });
  }
}

module.exports = { createOrder, processOrder, completeOrder };
