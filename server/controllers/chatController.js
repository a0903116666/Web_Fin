async function getMessages(req, res) {
  const { other_user_id } = req.params;
  const my_id = req.user.id;

  try {
    const messages = await req.db.all(`
      SELECT * FROM Messages
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `, [my_id, other_user_id, other_user_id, my_id]);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function sendMessage(req, res) {
  const { receiver_id, content } = req.body;
  const sender_id = req.user.id;

  try {
    const result = await req.db.run(`
      INSERT INTO Messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)
    `, [sender_id, receiver_id, content]);

    res.status(201).json({ message: 'Message sent', id: result.lastID });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function getContacts(req, res) {
  const my_id = req.user.id;
  try {
    // Get unique users I've chatted with
    const contacts = await req.db.all(`
      SELECT DISTINCT u.id, u.username
      FROM Users u
      JOIN Messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
      WHERE u.id != ? AND (m.sender_id = ? OR m.receiver_id = ?)
    `, [my_id, my_id, my_id]);

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getMessages, sendMessage, getContacts };
