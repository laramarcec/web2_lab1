const express = require('express');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

router.post('/generate', ticketController.generateTicket);
router.get('/:id', ticketController.getTicketInfo);

module.exports = router;
