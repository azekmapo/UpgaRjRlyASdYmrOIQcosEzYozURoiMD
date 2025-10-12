const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from origin ${req.headers.origin}`);
  next();
});

const getAllowedOrigins = () => {
  const defaultOrigins = [
    "http://localhost:5173", 
    "http://localhost:8000",
    "http://frontend:5173",
    "http://backend:80",
    "*"
  ];
  
  const origins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : defaultOrigins;
  return origins;
};

// CORS middleware configuration
const corsOptions = {
  origin: function (origin, callback) {
    // If no origin (like same origin or from server), allow
    if (!origin) return callback(null, true);
    
    const allowedOrigins = getAllowedOrigins();
    // If wildcard is allowed or specific origin is in list
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.warn(`Origin rejected by CORS: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev")); // Logging middleware

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000, // Close connection after 60s of inactivity
  pingInterval: 25000, // Check connection every 25s
  transports: ['websocket', 'polling'],
  allowEIO3: true // Support both Socket.IO v2 and v3 clients
});

// Store connected users
const connectedUsers = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Register user to receive notifications
  socket.on("register", (userId) => {
    if (!userId) {
      console.log("Registration failed: No user ID provided");
      return;
    }

    // If user is already connected, disconnect the old socket
    const existingSocketId = connectedUsers.get(userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        console.log(`User ${userId} already connected. Disconnecting old socket ${existingSocketId}`);
        existingSocket.disconnect(true);
      }
    }

    console.log("User registered:", userId);
    connectedUsers.set(userId, socket.id);
    socket.userId = userId; // Store userId in socket for easier access
    socket.join(`user-${userId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    if (socket.userId) {
      console.log(`User ${socket.userId} disconnected`);
      connectedUsers.delete(socket.userId);
    } else {
      // If userId is not stored in socket, search in the map
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          console.log(`User ${userId} disconnected`);
          connectedUsers.delete(userId);
          break;
        }
      }
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
});

app.get("/", (req, res) => {
  res.send(`<h1>Notification Server</h1>
    <p>Status: Running</p>
    <p>Time: ${new Date().toISOString()}</p>
    <p>Connected users: ${connectedUsers.size}</p>`);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get connected users endpoint (for debugging)
app.get("/connected-users", (req, res) => {
  const users = Array.from(connectedUsers.keys());
  res.json({ 
    count: users.length,
    users 
  });
});

// Emit notification endpoint
app.post("/emit-notification", express.json(), (req, res) => {
  try {
    const { userId, notification } = req.body;
    
    if (!userId || !notification) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: userId and notification" 
      });
    }

    console.log(`Emitting notification to user ${userId}:`, notification);
    
    // Check if user is connected
    const socketId = connectedUsers.get(userId);
    if (!socketId) {
      return res.json({
        success: true,
        message: "User is not currently connected, notification will be delivered when they reconnect",
        delivered: false
      });
    }
    
    // Emit to specific user
    io.to(`user-${userId}`).emit("notification", notification);

    return res.json({ 
      success: true, 
      message: "Notification sent successfully",
      delivered: true
    });
  } catch (error) {
    console.error("Error emitting notification:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to emit notification", 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0"; // Listen on all interfaces

server.listen(PORT, HOST, () => {
  const environment = process.env.NODE_ENV || "development";
  console.log(`Socket.IO server running at http://${HOST}:${PORT} in ${environment} mode`);
});
