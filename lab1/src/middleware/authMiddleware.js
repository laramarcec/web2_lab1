const { auth } = require('express-openid-connect');

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const validateAccessToken = (req, res, next) => 
{
    const authHeader = req.headers['authorization'];
    if (!authHeader) 
    {
        console.error('authorization header missing');
        return res.sendStatus(403); 
    }

    const token = authHeader.split(' ')[1];
    if (!token) 
    {
        console.error('token missing');
        return res.sendStatus(403); 
    }


    const client = jwksClient
    (
        {
            jwksUri: `${process.env.AUTH0_ISSUER_BASE_URL}.well-known/jwks.json`
        }
    );

    const { kid } = jwt.decode(token, { complete: true }).header;

    client.getSigningKey(kid, (err, key) => 
    {
        if (err) 
        {
            console.error('signing key error', err.message);
            return res.sendStatus(403); 
        }

        console.log(process.env.AUTH0_ISSUER_BASE_URL);

        const signingKey = key.getPublicKey();

        jwt.verify
        (
            token,
            signingKey,
            { 
                audience: process.env.AUTH0_AUDIENCE, 
                issuer: process.env.AUTH0_ISSUER_BASE_URL 
            },
            (err, decoded) => 
            {
                if (err) 
                    {
                    console.error('jwt verification failed:', err);
                    return res.sendStatus(403);
                    }
                req.user = decoded;
                console.log('access token successfully validated');
                next(); 
            }
        );
    });
};

module.exports = 
{
    validateAccessToken
}; 