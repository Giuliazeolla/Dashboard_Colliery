const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token mancante' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // tipicamente contiene { id, email, ecc. }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token non valido o scaduto' });
  }
}

module.exports = authenticateToken;
