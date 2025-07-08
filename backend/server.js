require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');

const workerRoutes = require('./routes/operai');
const machineRoutes = require('./routes/mezzi');
const attrezziRoutes = require('./routes/attrezzi');
const authRoutes = require('./routes/auth');
const commesseRoutes = require('./routes/commesse');
const attivitaRoutes = require('./routes/attivita');
const assegnazioniRoute = require('./routes/assegnazioni');

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Inizializza Prisma Client
const prisma = new PrismaClient();

// Inizializza Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Verifica connessione a DB Prisma (facoltativo)
async function checkPrismaConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Connessione Prisma riuscita");
  } catch (err) {
    console.error("❌ Connessione Prisma fallita:", err.message);
    process.exit(1);
  }
}
checkPrismaConnection();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Passa prisma agli endpoint che ne hanno bisogno (se serve)
const attivitaRouter = attivitaRoutes(io, prisma);
const commesseRouter = commesseRoutes(io, prisma);
const assegnazioniRouter = assegnazioniRoute(io, prisma);

// Route API
app.use('/api/auth', authRoutes);
app.use('/api/commesse', commesseRouter);
app.use('/api/assegnazioni', assegnazioniRouter);
app.use('/api/attivita', attivitaRouter);
app.use('/api/operai', workerRoutes);
app.use('/api/mezzi', machineRoutes);
app.use('/api/attrezzi', attrezziRoutes);

// Socket.io events
io.on('connection', (socket) => {
  console.log('🔌 Socket connesso:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnesso:', socket.id);
  });
});

// Middleware errori
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Errore interno del server' });
});

// Avvia server
server.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
