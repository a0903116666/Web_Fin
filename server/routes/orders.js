const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { createOrder, processOrder, completeOrder } = require('../controllers/orderController');

router.post('/', authenticateToken, createOrder);
router.post('/:id/process', authenticateToken, processOrder);
router.post('/:id/complete', authenticateToken, completeOrder);

module.exports = router;
