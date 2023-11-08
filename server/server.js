const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const helmet = require("helmet");

app.use(helmet());
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.1.102:3000"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("create_room", (createData) => {
    socket.join(createData.room);
  });

  socket.emit("welcome", {
    message: "You can leave a message,but he can't replay you!",
  });

  socket.on("send_message", async (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", (data) => {
    // used for update all users
    io.sockets.emit("onlineStatus");
  });
});

io.of("/admin").use((socket, next) => {
  if (socket.handshake.auth.password) {
    socket.password = getPassword(socket.handshake.auth.password);
    next();
  } else {
    next(new Error("Authentication error"));
  }
});

function getPassword(password) {
  return password;
}

io.of("/admin").on("connection", (socket) => {
  socket.on("login", (data) => {
    try {
      if (data === "parola") {
        async function fetchData() {
          const response = await fetch("http://localhost:3030/history-messages");
          const dataHistory = await response.json();

          socket.emit("loadMessages", dataHistory);
          return dataHistory;
        }
        fetchData();

        socket.emit("loginAuth", {
          isLogin: true,
          message: "You are logged in successfully",
          token: "secretKey",
        });

        socket.on("searchByFilter", async (data) => {
          console.log(data);
          if (data.filterBy === "all" && data.value === "") {
            const response = await fetch("http://localhost:3030/history-messages");
            const dataHistory = await response.json();
            console.log(dataHistory);
            socket.emit("messagesHistory", dataHistory);
            return dataHistory;
          } else {
            const response = await fetch(
              `http://localhost:3030/history-messages?${data.filterBy}=${data.value}`
            );
            const dataHistory = await response.json();

            socket.emit("sendFilter", dataHistory);
          }
        });
      } else {
        socket.emit("loginAuth", { isLogin: false, message: "Authentication error" });
      }
    } catch (error) {
      new Error(error);
    }
  });
});

server.listen(5555, () => {
  console.log("SERVER RUNNING");
});
