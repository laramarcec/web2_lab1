const express = require('express');
const { requiresAuth } = require('express-openid-connect');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

router.post('/create', requiresAuth(), ticketController.createTicket);

module.exports = router;
