const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html as default page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Handle socket connections
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("sendLocation", (data) => {
        console.log("Received location:", data);
        io.emit("updateLocation", data); // Broadcast location to all clients
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// Start server on port 3000
server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
