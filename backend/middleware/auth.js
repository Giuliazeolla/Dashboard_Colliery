const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token mancante' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token non valido' });

    // user è il payload decodificato: deve contenere almeno { id: ... }
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
