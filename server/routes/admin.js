const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken, requireAdmin);

router.get('/users', authenticateToken, requireAdmin, adminController.getAllUsers);
router.post('/users/:id/block', authenticateToken, requireAdmin, adminController.toggleBlockUser);
router.delete('/users/:id', authenticateToken, requireAdmin, adminController.deleteUser);

router.get('/products', adminController.getAllProducts);
router.delete('/products/:id', adminController.deleteProduct);

router.get('/sos', adminController.getAllSOS);
router.delete('/sos/:id', adminController.deleteSOS);

module.exports = router;
