require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth.routes");
const profileRouter = require("./routes/profile.routes");
const gigRouter = require("./routes/gig.routes");
const chatRouter = require("./routes/chat.routes");
const paymentRouter = require("./routes/payment.routes");
const reviewRouter = require("./routes/review.routes");
const notificationRouter = require("./routes/notification.routes");
const adminRouter = require("./routes/admin.routes");
const disputeRouter = require("./routes/dispute.routes");

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

// Expose io instance to express app
app.set("io", io);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/gigs", gigRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/disputes", disputeRouter);

// Test Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully!",
  });
});

// Socket Connection handling
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join a personal user room for direct events / notifications
  socket.on("join_user", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User joined personal room: user_${userId}`);
    }
  });

  // Join a specific chat room
  socket.on("join_chat", (chatId) => {
    if (chatId) {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    }
  });

  // Handle typing state
  socket.on("typing", ({ chatId, userId, userName }) => {
    socket.to(chatId).emit("typing", { chatId, userId, userName });
  });

  socket.on("stop_typing", ({ chatId, userId }) => {
    socket.to(chatId).emit("stop_typing", { chatId, userId });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

