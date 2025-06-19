// server.js (o index.js)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';

import workerRoutes from './routes/worker.js';
import machineRoutes from './routes/machines.js';
import activityRoutes from './routes/activities.js';
import authRoutes from './routes/auth.js';
import commesseRoutes from './routes/commesse.js';

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

app.use('/api/auth', authRoutes);
app.use('/api/commesse', commesseRoutes(io)); // Passa io per socket
app.use('/api/workers', workerRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/activities', activityRoutes);

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
