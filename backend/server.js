require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');

const workerRoutes = require('./routes/worker');
const machineRoutes = require('./routes/machines');
const authRoutes = require('./routes/auth');
const commesseRoutes = require('./routes/commesse');
const attivitaRoutes = require('./routes/activities');






const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connessione MongoDB riuscita"))
  .catch((err) => {
    console.error("❌ Connessione MongoDB fallita:", err.message);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Passa io come parametro alle route che lo richiedono
app.use('/api/auth', authRoutes);
app.use('/api/commesse', commesseRoutes(io));
app.use('/api/activities', attivitaRoutes(io));
app.use('/api/workers', workerRoutes);
app.use('/api/machines', machineRoutes);


io.on('connection', (socket) => {
  console.log('🔌 Socket connesso:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnesso:', socket.id);
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Errore interno del server' });
});

server.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
