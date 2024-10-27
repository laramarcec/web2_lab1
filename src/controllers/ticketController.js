const { Pool } = require('pg');
const qrcode = require('qrcode');
const axios = require('axios');

require('dotenv').config();

const pool = new Pool(
{
  connectionString: process.env.DATABASE_URL,
  ssl : 
  { 
    rejectUnauthorized: false 
  }
});


const generateTicket = async (req, res) => 
{
  const { vatin, firstName, lastName } = req.body;

  try
  {  
  
    const result = await pool.query('SELECT COUNT(*) FROM tickets WHERE vatin = $1', [vatin]);

    if (parseInt(result.rows[0].count) >= 3) 
    {
      return res.status(400).json({ error: 'max 3 tickets per vatin' });
    }

    const ticket = await pool.query
    (
      'INSERT INTO tickets (vatin, first_name, last_name) VALUES ($1, $2, $3) RETURNING *',
      [vatin, firstName, lastName]
    );
    
    const ticketId = ticket.rows[0].id;
    const qrCodeDataURL = await qrcode.toDataURL(`https://web2ticketgenerator.onrender.com/api/ticket/${ticketId}`);

    res.render('ticketGenerated', {qrCodeDataURL});

  }
  catch (error) 
  {
    console.error('error generating ticket:', error); 
    res.status(500).json({ error: 'internal server error' });
  }
};

const getTicketInfo = async (req, res) => 
  {
  const ticketId = req.params.id;
  try 
  {
    const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
    
    if (result.rows.length === 0)
    {
      return res.status(404).json({ error: 'ticket not found' });
    }

    const ticket = result.rows[0];

    const createdAtFormatted = new Date(ticket.createdat).toLocaleString('en-GB', 
    {
      timeZone: 'Europe/Zagreb', 
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const isAuthenticated = req.oidc.isAuthenticated();

    const userName = isAuthenticated ? req.oidc.user.email : null;

    const loginButton = !req.oidc.isAuthenticated() ? '<a class = "loginbtn" href="/login"><button>login</button></a>' : '<a class = "loginbtn" href="/logout"><button>logout</button></a>';

    res.render('ticketInfo', {ticket, createdAtFormatted, userName, loginButton});

  } 
  catch (error)
  {
    console.error('error generating ticket:', error); 
    res.status(500).json({ error: 'internal server error' });
  }
};

module.exports = 
{
  generateTicket,
  getTicketInfo,
};