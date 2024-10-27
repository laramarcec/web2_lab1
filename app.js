const { Pool } = require('pg');
const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const axios = require('axios');
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');

const ticketController = require('./src/controllers/ticketController');
const ticketRoutes = require('./src/routes/ticketRoutes');

require('dotenv').config();

const app = express();
const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4080; 

app.use(express.json());
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/styles', express.static(path.join(__dirname, 'src/views/styles')));

const pool = new Pool(
{
  connectionString: process.env.DATABASE_URL,
  ssl : 
  { 
    rejectUnauthorized: false 
  }
});

app.use('/api/ticket/generate', ticketRoutes);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views')); 
 

const config = 
{
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: externalUrl || `https://localhost:${port}`,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
};

app.use(auth(config));

app.get('/', async (req, res) => 
{
  try 
  {
    const result = await pool.query('SELECT COUNT(*) FROM tickets');

    const totalTickets = result.rows[0].count;

    const totalTicketsMessage = `total number of generated tickets: ${totalTickets}`;
    
    const loginButton = !req.oidc.isAuthenticated() ? '<a href="/login"><button>login</button></a>' : '<a href="/logout"><button>logout</button></a>';

    const generateTicketForm = 
    `
      <form id="ticketForm">
        <label>VATIN: <input type="text" name="vatin" required></label><br>
        <label>FIRST NAME: <input type="text" name="firstName" required></label><br>
        <label>LAST NAME: <input type="text" name="lastName" required></label><br>
        <button type="button" onclick="generateTicket()">generate a ticket</button>
      </form>
      <div id="message" style="color: red; margin-top: 20px; font-weight:500;"></div>
      <script src="/js/ticketForm.js"></script>
    `;

  
    res.render('mainPage', 
      {
      totalTicketsMessage,
      generateTicketForm,
      }
    );


  }
  catch (error)
  {
    console.error('error fetching ticket count:', error);
    res.status(500).send('error fetching the total number of tickets.');
  }
});


if (externalUrl) {   
  const hostname = '0.0.0.0'; 
  app.listen(port, hostname, () => {     
    console.log(`Server locally running at http://${hostname}:${port}/ and from outside on ${externalUrl}`);   
  });
} 
else { 
  https.createServer({ 
    key: fs.readFileSync('server.key'), 
    cert: fs.readFileSync('server.cert') 
  }, app) 
  .listen(port, function () {
    console.log(`Server running at https://localhost:${port}/`);
  }); 
} 

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

app.get('/api/ticket/:id', requiresAuth(), (req, res) => {
  ticketController.getTicketInfo(req, res);
  
});


app.get('/api/token', async (req, res) => 
{
  const options = 
  {
    method: 'POST',
    url: 'https://dev-gra82vlmiwa4hpni.us.auth0.com/oauth/token',
    headers: 
    { 
      'content-type': 'application/json' 
    },
    data: 
    {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: 'https://ticketsapi', 
      grant_type: 'client_credentials',
      scope: "generate:ticket",
    }
  };

  try 
  {
    const response = await axios.request(options);
    res.json({ accessToken: response.data.access_token }); 
  }
  catch (error)
  {
    console.error('error fetching access token:', error);
    res.status(500).json({ message: 'failed to fetch access token' });
  }
})