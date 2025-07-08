const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Registrazione utente
router.post('/register', async (req, res) => {
  console.log('Entrato in /register');
  console.log('Body:', req.body);
  const { username, email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: 'Email già registrata' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    try {
      const newUser = await prisma.user.create({
        data: { username, email, passwordHash }
      });
      console.log("✅ Utente salvato:", newUser);
    } catch (saveError) {
      console.error('Errore nel salvataggio utente:', saveError);
      return res.status(500).json({ message: 'Errore nel salvataggio utente', error: saveError.message });
    }

    res.status(201).json({ message: 'Utente registrato' });
  } catch (error) {
    console.error('Errore registrazione', error);
    res.status(500).json({ message: 'Errore interno', error: error.message });
  }
});

// Login utente
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(400).json({ message: 'Email o password errati' });

    const validPass = await bcrypt.compare(password, user.passwordHash);
    if (!validPass)
      return res.status(400).json({ message: 'Email o password errati' });

    // CREA ACCESS TOKEN (valido 24 ore)
    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // CREA REFRESH TOKEN (valido 7 giorni)
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // INVIA refreshToken come COOKIE HTTPONLY
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni in ms
    });

    // RITORNA accessToken nel body della risposta
    res.json({
      token: accessToken,
      user: { username: user.username, email: user.email }
    });

  } catch (error) {
    console.error('Errore login:', error.message);
    res.status(500).json({ message: 'Errore interno', error: error.message });
  }
});

// Reset password con token
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ message: 'Password richiesta' });

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ message: 'Token non valido o scaduto' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      }
    });

    res.json({ message: 'Password aggiornata con successo' });
  } catch (err) {
    console.error('Errore reset-password:', err.message);
    res.status(500).json({ message: 'Errore interno' });
  }
});

// Password dimenticata - genera token
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email richiesta' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Utente non trovato' });

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 ora da ora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      }
    });

    console.log(`Link reset password: http://localhost:3000/reset-password/${token}`);

    res.json({ message: 'Email per reset inviata' });
  } catch (error) {
    console.error('Errore forgot-password:', error.message);
    res.status(500).json({ message: 'Errore interno' });
  }
});

// Refresh token per rigenerare access token
router.post('/refresh', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'Token mancante' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ token: accessToken });
  } catch (err) {
    console.error('Refresh token non valido:', err.message);
    return res.status(403).json({ message: 'Refresh token non valido' });
  }
});

module.exports = router;
