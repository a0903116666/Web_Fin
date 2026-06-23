const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/contacts', authenticateToken, chatController.getContacts);
router.get('/:other_user_id', authenticateToken, chatController.getMessages);
router.post('/', authenticateToken, chatController.sendMessage);

module.exports = router;
