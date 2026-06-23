const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/wishlist', authenticateToken, communityController.toggleWishlist);
router.get('/wishlist/check/:product_id', authenticateToken, communityController.checkWishlist);
router.get('/sos', communityController.getSOSRequests);
router.post('/sos', authenticateToken, communityController.createSOSRequest);
router.put('/sos/:id', authenticateToken, communityController.updateSOSRequestStatus);
router.post('/return', authenticateToken, communityController.returnRental);

module.exports = router;
