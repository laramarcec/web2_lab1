const express = require('express');
const ticketRoutes = require('./src/routes/ticketRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

app.use('/api/tickets', ticketRoutes);

const { auth, requiresAuth  } = require('express-openid-connect');

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
};

app.use(auth(config));

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM tickets');
    const totalTickets = result.rows[0].count;

    const totalTicketsMessage = `Ukupan broj generiranih ulaznica: ${totalTickets}`;
    const authMessage = req.oidc.isAuthenticated() ? 'logged in' : 'logged out';
    
    const loginButton = !req.oidc.isAuthenticated() 
    ? '<a href="/login"><button>login</button></a>'
    : '<a href="/logout"><button>logout</button></a>';

    const generateTicketButton = req.oidc.isAuthenticated() 
    ? '<a href="/api/tickets/generate"><button>generate a ticket</button></a>'
    : '<p></p>';

  
    res.send(`
      <html>
        <body>
          <h1>${totalTicketsMessage}</h1>
          <p>Status: ${authMessage}</p>
          ${loginButton}
          ${generateTicketButton}
        </body>
      </html>
    `);


  } catch (error) {
    console.error('Eeror fetching ticket count:', error);
    res.status(500).send('error fetching the total number of tickets.');
  }
});
app.listen(process.env.PORT || 3000, () =>
{
    console.log(`server running on port ${process.env.PORT || 3000}`);
});


const { requiresAuth } = require('express-openid-connect');

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});