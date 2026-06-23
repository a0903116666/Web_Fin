const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden: Invalid Token' });
    
    try {
      if (req.db) {
        const dbUser = await req.db.get('SELECT is_blocked FROM Users WHERE id = ?', [user.id]);
        if (dbUser && dbUser.is_blocked) {
          return res.status(403).json({ message: '您的帳號已被封鎖，禁止操作' });
        }
      }
    } catch (e) {
      console.error(e);
    }

    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Requires Admin Role' });
  }
}

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
}

module.exports = { authenticateToken, requireAdmin, generateToken, JWT_SECRET };
