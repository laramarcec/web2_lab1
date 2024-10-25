const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})
const qrcode = require('qrcode');

exports.generateTicket = async (req, res) =>
{
    const { vatin, firstName, lastName } = req.body;
    if( !vatin || !firstName || !lastName ) {
        return res.status(400).json({ error: 'missing required data'});
    }
    try{
        const result = await pool.query('SELECT COUNT(*) FROM tickets WHERE vatin = $1', [vatin]);
        if (parseInt(result.rows[0].count) >= 3) {
            return res.status(400).json({ error: 'max 3 tickets per vatin' });
        }

        const ticket = await pool.query(
            'INSERT INTO tickets (vatin, first_name, last_name) VALUES ($1, $2, $3) RETURNING *',
            [vatin, firstName, lastName]
          );
      
        const ticketId = ticket.rows[0].id;
        const qrcode = require('qrcode');

        //const qrCode = await qrcode.toBuffer(`https://www.youtube.com/`);

    
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(qrCode);
    } catch (error) {
        console.error('error generating ticket:', error); 
        res.status(500).json({ error: 'internal server error' });
    }
};

exports.getTicketInfo = async (req, res) => {
    const ticketId = req.params.id;
    try {
      const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'ticket not found' });
      }
  
      const ticket = result.rows[0];
      res.json({
        vatin: ticket.vatin,
        firstName: ticket.first_name,
        lastName: ticket.last_name,
        createdAt: ticket.created_at,
      });
    } catch (error) {
      console.error('Error generating ticket:', error); 
      res.status(500).json({ error: 'internal server error' });
    }
};

