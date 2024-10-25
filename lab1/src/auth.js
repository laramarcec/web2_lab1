const axios = require('axios');
const { auth } = require('express-oauth2-jwt-bearer');

async function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if(!token) 
        return res.status(401).json({message: 'unauthorized access'});

    try {
        const decoded = jwt.decode(token);
        if(!decoded)
            throw new Error('token not valid');

        req.user = decoded;

        next();
    }
    catch (error) {
        res.status(401).json({message: 'unauthorized access'});
    }
}

async function getAccessToken() {
    const response = await axios.post(process.env.AUTH0_TOKEN_URL, {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
      grant_type: 'client_credentials'
    });
  
    return response.data.access_token;
  }

module.exports = auth;