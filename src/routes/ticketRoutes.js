const express = require('express');
const jwt = require('jsonwebtoken');
const { auth, requiresAuth } = require('express-openid-connect');

const ticketController = require('../controllers/ticketController');
const { validateAccessToken } = require('../middleware/authMiddleware'); 

require('dotenv').config();
  
const router = express.Router();

router.post('/', validateAccessToken, ticketController.generateTicket);

module.exports = router;
