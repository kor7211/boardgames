//===set up server ===
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path"); // ← ここで require

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// デバッグ用にパスを確認
console.log("__dirname:", __dirname);
console.log("public path:", path.join(__dirname, "..", "public"));

// public 配下を静的配信
app.use(express.static(path.join(__dirname, "..", "public")));

require("./socketHandler")(io);

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
