const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', productController.getAllProducts);
router.get('/tags', productController.getTags);
router.get('/:id', productController.getProductById);
router.post('/', authenticateToken, productController.createProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);

module.exports = router;
