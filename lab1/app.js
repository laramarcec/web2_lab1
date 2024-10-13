const express = require('express');
const {auth} = require('express-openid-connect');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,

}

app.use(auth(config));

app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
  });

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});

/*

app.use('api/tickets', ticketRoutes);

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});

*/