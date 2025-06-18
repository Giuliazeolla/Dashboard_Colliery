require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const workerRoutes = require('./routes/worker');
const machineRoutes = require('./routes/machines');
const activityRoutes = require('./routes/activities');
const authRoutes = require('./routes/auth');
const commesseRoutes = require('./routes/commesse');
const cookieParser = require('cookie-parser');



const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connessione MongoDB riuscita"))
.catch((err) => {
  console.error("❌ Connessione MongoDB fallita:", err.message);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/commesse', commesseRoutes);
app.use('/api/jobs', require('./routes/createJob')(io));
app.use('/api/workers', workerRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/activities', activityRoutes);
app.use(cookieParser());

// Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Socket connesso:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnesso:', socket.id);
  });
});

// Server
server.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
});
