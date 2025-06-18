const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[Auth Middleware] Authorization header mancante');
      return res.status(401).json({ message: 'Token di autorizzazione mancante' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('[Auth Middleware] Formato header Authorization non valido:', authHeader);
      return res.status(401).json({ message: 'Formato token non valido' });
    }

    const token = parts[1];
    console.log('[Auth Middleware] Token ricevuto:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tuo_secret');
    req.user = decoded;

    next();
  } catch (error) {
    console.error('[Auth Middleware] Errore verifica token:', error.message);
    return res.status(401).json({ message: 'Token non valido o scaduto' });
  }
};
