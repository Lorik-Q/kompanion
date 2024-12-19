const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);

// In-memory storage voor users
const users = [];

// CORS configuratie
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);

app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// Auth routes
app.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      const token = jwt.sign({ id: user.id, email }, "your_jwt_secret", {
        expiresIn: "24h",
      });
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } else {
      // Voor test doeleinden - hardcoded credentials
      if (email === "test@test.com" && password === "test123") {
        const token = jwt.sign({ id: 1, email }, "your_jwt_secret", {
          expiresIn: "24h",
        });
        return res.json({
          token,
          user: {
            id: 1,
            name: "Test User",
            email,
          },
        });
      }
      res.status(401).json({ message: "Ongeldige inloggegevens" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/register", (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (users.some((u) => u.email === email)) {
      return res.status(400).json({ message: "Email is al in gebruik" });
    }

    const newUser = {
      id: users.length + 1,
      name,
      email,
      password, // In een echte applicatie zou je dit hashen
    };

    users.push(newUser);

    const token = jwt.sign({ id: newUser.id, email }, "your_jwt_secret", {
      expiresIn: "24h",
    });

    res.json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let waitingUsers = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("findMatch", () => {
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.shift();
      const roomId = `room_${Date.now()}`;

      socket.join(roomId);
      io.sockets.sockets.get(partner).join(roomId);

      io.to(socket.id).emit("matchFound", { roomId, isInitiator: true });
      io.to(partner).emit("matchFound", { roomId, isInitiator: false });
    } else {
      waitingUsers.push(socket.id);
    }
  });

  socket.on('offer', ({ offer, roomId }) => {
    console.log(`Offer ontvangen voor room: ${roomId}`);
    socket.to(roomId).emit('offer', { offer });
  });
  
  socket.on('answer', ({ answer, roomId }) => {
    console.log(`Answer ontvangen voor room: ${roomId}`);
    socket.to(roomId).emit('answer', { answer });
  });
  

  socket.on('iceCandidate', ({ candidate, roomId }) => {
    console.log(`ICE candidate ontvangen voor room: ${roomId}`);
    socket.to(roomId).emit('iceCandidate', candidate);
  });

  socket.on("disconnect", () => {
    waitingUsers = waitingUsers.filter((id) => id !== socket.id);
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
