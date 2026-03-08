//===game logic js===
const game1 = require("./games/playAnotherDay"); //playAnotherDay

const players_map = {
  game1: { min: 2, max: 5 },
};
//===Client recieve/send===
module.exports = (io) => {
  const rooms = {};

  //---Run when connect---
  io.on("connection", (socket) => {
    console.log("SH: connected: ", socket.id);

    //--create room--
    socket.on("create_room", (game_type, user_name) => {
      const old_room = find_room_by_socket(socket.id);
      if (old_room) {
        console.log(
          "SH: old_room_exist: ",
          old_room.status.room_code,
          ",",
          socket.id,
        );
        socket.emit("unsuccess", {
          status: old_room,
          type: "old_room_exist",
        });
        return;
      }

      let room_code = "0000";

      while (true) {
        room_code = generate_room_code();
        if (!is_code_exist(room_code)) {
          break;
        }
      }

      const players_min = players_map[game_type]?.min;
      const players_max = players_map[game_type]?.max;
      if (!(players_min == null || players_max == null)) {
        console.log("SH: game_not_found:", game_type);
        socket.emit("unsuccess", {
          status: null,
          type: "game_not_found",
        });
        return;
      }

      rooms[room_code] = {
        game_info: {
          type: game_type,
          players_min: players_min,
          players_max: players_max,
        },
        is_in_game: false,
        is_transition_progress: false,
        players: [],
        disconnected: {},
        status: {
          room_code: room_code,
          players: [],
        },
      };

      socket.join(room_code);
      rooms[room_code].players.push({
        id: socket.id,
        name: user_name,
        ready: false,
        connection: true,
      });
      rooms[room_code].status.players.push({
        id: socket.id,
        unique_id: user_name + socket.id,
        name: user_name,
      });

      socket.emit("success", {
        status: rooms[room_code],
        type: "room_created",
      });
    });

    //--join room--
    socket.on("join_room", (room_code, user_name) => {
      const old_room = find_room_by_socket(socket.id);
      if (old_room) {
        console.log(
          "SH: old_room_exist: ",
          old_room.status.room_code,
          ",",
          socket.id,
        );
        socket.emit("unsuccess", {
          status: old_room,
          type: "old_room_exist",
        });
        return;
      }

      if (room_code in rooms) {
        if (rooms[room_code].is_in_game) {
          console.log("SH: room_is_in_game: ", room_code);
          socket.emit("unsuccess", {
            status: rooms[room_code],
            type: "room_in_game",
          });
          return;
        }

        socket.join(room_code);
        console.log("SH: player_join: ", socket.id);

        rooms[room_code].players.push({
          id: socket.id,
          name: user_name,
          ready: false,
          connection: true,
        });
        rooms[room_code].status.players.push({
          id: socket.id,
          unique_id: user_name + socket.id,
          name: user_name,
        });

        socket.emit("success", {
          status: rooms[room_code],
          type: "joined_room",
        });

        io.to(room_code).emit("status_updated", {
          status: rooms[room_code],
          type: "player_joined",
        });
      } else {
        socket.emit("unsuccess", {
          status: null,
          type: "room_not_found",
        });
      }
    });

    //--exit room--
    socket.on("exit_room", () => {
      exit_room(socket.id);
    }); // ここも後で見る

    //--ready room--
    socket.on("ready", (room_code) => {
      const room = rooms[room_code];

      if (!room) {
        console.log("SH: room_not_exist:", room_code);
        socket.emit("unsuccess", {
          status: null,
          type: "room_not_found",
        });
        return;
      }

      const player = room.players.find((p) => p.id == socket.id);

      if (!player) {
        console.log("SH: player_not_found:", socket.id);
        socket.emit("unsuccess", {
          status: room,
          type: "player_not_found",
        });
        return;
      }

      player.ready = true;

      socket.emit("success", {
        status: room,
        type: "player_ready",
      });

      io.to(room_code).emit("status_updated", {
        status: room,
        type: "player_ready",
      });

      const is_all_ready = room.players.every((p) => p.ready);
      if (!is_all_ready) {
        console.log("SH: not_all_ready");
        console.log("SH: players: ", room.players);
        return;
      } else {
        if (room.players.length < room.game_info.players_min) {
          console.log(
            "SH: less_players: ",
            room.players.length,
            "<",
            room.game_info.players_min,
          );
          return;
        } else if (room.players.length > room.game_info.players_max) {
          console.log(
            "SH: more_players: ",
            room.players.length,
            ">",
            room.game_info.players_max,
          );
          return;
        }
      }

      room.players.forEach((p) => {
        p.ready = false;
      });

      room.is_transition_progress = true;
      //gameのInit
      if (room.game_info.type == "game1") {
        io.to(room_code).emit("status_updated", {
          status: room,
          type: "room_ready",
          link: "/games/playAnotherDay/index.html",
        });
        room.status = game1.status_init(room.status);
      }
    });

    socket.on("complete_reconnection", (room_code) => {
      const room = rooms[room_code];
      if (!room) {
        console.log("SH: room_not_found: ", room_code);
        socket.emit("unsuccess", {
          status: null,
          type: "room_not_found",
        });
        return;
      }
      if (room.is_in_game) {
        console.log("SH: room_in_game: ", room_code);
        socket.emit("unsuccess", {
          status: room,
          type: "room_in_game",
        });
        return;
      }

      const player = room.players.find((p) => p.id == socket.id);

      if (!player) {
        console.log("SH: player_not_found:", socket.id);
        socket.emit("unsuccess", {
          status: room,
          type: "player_not_found",
        });
        return;
      }

      player.ready = true;

      socket.emit("success", {
        status: room,
        type: "player_ready",
      });

      io.to(room_code).emit("status_updated", {
        status: room,
        type: "player_ready",
      });

      const is_all_ready = room.players.every((p) => p.ready);
      if (!is_all_ready) {
        console.log("SH: not_all_ready");
        console.log("SH: players: ", room.players);
        return;
      }

      room.players.forEach((p) => {
        p.ready = false;
      });

      room.is_in_game = true;
      room.is_transition_progress = false;

      console.log("SH: ", room);

      io.to(room_code).emit("init", room.status); // ここ綺麗にできるかも
    });

    //===game logic===
    //---send player move to game logic---
    socket.on("player_move", (data) => {
      const { room_code, move } = data;

      const room = rooms[room_code];
      if (!room) return;

      const result = game1.make_move(room.status, move);
      if (result == "exit_game") {
        exit_game(room_code);
        return;
      }
      room.status = result;

      io.to(room_code).emit("update_state", room.status);
    });

    //---send player try to game logic---
    socket.on("player_try", (data) => {
      console.log("SH: get_try");
      const { room_code, submittion } = data;

      const room = rooms[room_code];

      if (!room) {
        console.log("SH: room_not_found: ", room_code);
        socket.emit("can_submit", {
          can_submit: false,
          status: null,
          submittion,
        });
        return;
      }

      if (!room.players.every((p) => p.connection)) {
        console.log("SH: some_player_disconnected: ", room_code);
        socket.emit("can_submit", {
          can_submit: false,
          status: null,
          submittion,
        });
      }

      const can_submit = game1.check_submittion(room.status, submittion);

      console.log("SH: can_submit?: ", can_submit);
      socket.emit("can_submit", {
        can_submit,
        status: room.status,
        submittion,
      });
    });

    socket.on("exit_game", (data) => {
      exit_game(data.room_code);
    });

    //---end of the game---
    function exit_game(room_code) {
      console.log("SH: get_exit");

      if (!rooms[room_code]) return;

      io.to(room_code).emit("exit_game");

      for (const p of rooms[room_code].players) {
        const s = io.sockets.sockets.get(p.id);
        if (s) s.disconnect(true);
      }

      delete rooms[room_code];
    }

    //===connection===
    //--disconnect--
    socket.on("disconnect", (reason) => {
      if (reason == "server namespace disconnect") return;
      if (reason == "client namespace disconnect") return;

      let room = find_room_by_socket(socket.id);
      if (!room) return;

      if (room.is_transition_progress) {
        return;
      }

      if (!room.is_in_game) {
        exit_room(socket.id);
        return;
      }

      const player = room.players.find((p) => p.id == socket.id);
      if (!player) return;

      player.ready = false;
      player.connection = false;

      switch (room.game_info.type) {
        case "game1":
          room.status = game1.on_disconnected(room.status, socket.id);
          break;
      }

      room.disconnected = room.disconnected || {};
      room.disconnected[socket.id] = setTimeout(() => {
        remove_player_from_room(socket.id, room);
        //一人抜けたときの処理
        exit_game(room.status.room_code);
      }, 30000);
    });

    //--reconnect--
    const { old_id, room_code } = socket.handshake.query;
    if (old_id) {
      console.log("SH: get_handshake");

      const room = rooms[room_code];
      if (!room) return;
      const player = room.players.find((p) => p.id == old_id);
      if (!player) return;

      const timeOut = room.disconnected[old_id];
      if (timeOut) clearTimeout(timeOut);

      player.connection = true;
      player.id = socket.id;

      const status_player = room.status.players.find((p) => p.id == old_id);
      if (status_player) {
        status_player.id = socket.id;
      }

      socket.join(room_code);
      socket.emit("update_id", socket.id);

      if (room.is_in_game) {
        io.to(room_code).emit("update_state", room.status);
      }

      console.log("SH: update_id", old_id, " => ", socket.id);
    }

    function exit_room(socket_id) {
      const room = find_room_by_socket(socket_id);
      if (!room) {
        console.log("SH: room_not_found");
        return;
      }

      const room_code = room.status.room_code;

      const s = io.sockets.sockets.get(socket_id);
      if (s) s.emit("exit_room");
      if (s) s.disconnect(true);

      remove_player_from_room(socket_id, room);

      const io_room = io.sockets.adapter.rooms.get(room_code);

      const count = io_room ? io_room.size : 0;

      console.log("SH: connection: ", count, "room: ", room_code);
      console.log("SH: players: ", room.players);

      if (count <= 0) {
        console.log("SH: delete_room: ", room_code);

        delete rooms[room_code];
        return;
      }

      room.players.forEach((p) => {
        p.ready = false;
      });

      io.to(room_code).emit("player_exit", room);

      console.log(io.sockets.adapter.rooms);
    }
  });

  //===functions===
  function is_code_exist(room_code) {
    for (const code in rooms) {
      if (code == room_code) {
        return true;
      }
    }
    return false;
  }

  function find_room_by_socket(socket_id) {
    for (const code in rooms) {
      const room = rooms[code];
      if (room.players.some((p) => p.id === socket_id)) {
        return room;
      }
    }
    return null;
  }

  function remove_player_from_room(socket_id, room) {
    room.players = room.players.filter((p) => p.id != socket_id);
    room.status.players = room.status.players.filter((p) => p.id != socket_id);
  }
};

function generate_room_code() {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
}
