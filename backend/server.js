require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully!",
  });
});

// Server
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
