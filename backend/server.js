require('dotenv').config();
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

// Route Imports
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const authRoutes = require('./routes/auth'); 
const orderSocket = require('./sockets.js/orderSocket');
const tableRoutes = require('./routes/table');
const inventoryRoutes = require('./routes/inventory'); 
const webhookRoutes = require('./routes/webhookRoutes');
const { scheduleBirthdayCron } = require('./jobs/birthdayCron');



const app = express();
const server = http.createServer(app);

// --- MULTI-APP CORS CONFIG ---
const allowedOrigins = [
  'http://localhost:5173', // Customer QR App
  'http://localhost:5174', // Admin Dashboard App
  'http://localhost:5175', // Kitchen Dashboard App
  process.env.ADMIN_URL,
  process.env.CUSTOMER_URL,
  process.env.KDS_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked for: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Socket.IO Setup
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
});

// Middleware 
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/api/webhook', webhookRoutes);

//STATIC FILES & UPLOADS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  req.io = io;
  next();
});


// MongoDB Connection 
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000, 
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => {
    console.error('MongoDB Connection Failed:', err.message);
    console.dir(err); 
    process.exit(1);
});

scheduleBirthdayCron();

// API ROUTES
app.use('/api/auth',       authRoutes); 
app.use('/api/admin',      adminRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/customers',  require('./routes/customer'));
app.use('/api/finance',    require('./routes/finance'));
app.use('/api/inventory',  inventoryRoutes); 
app.use('/api/menu',       require('./routes/menu'));
app.use('/api/orders',     require('./routes/order'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/reviews',    require('./routes/reviews'));
app.use('/api/tables',     tableRoutes);


app.get('/', (req, res) => res.send('RestoSync API is Active'));



orderSocket(io);

// GLOBAL ERROR HANDLING
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload Error: ${err.message}`,
      code: err.code
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowing origins: ${allowedOrigins.join(', ')}`);
});