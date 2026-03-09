//===game info===
const game_info_map = {
  game1: {
    players: { min: 2, max: 5 },
    logic: require("./games/playAnotherDay"),
    link: "/games/playAnotherDay/index.html",
  },
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
          room: old_room,
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

      const game = game_info_map[game_type];
      if (game == null) {
        console.log("SH: game_not_found:", game_type);
        socket.emit("unsuccess", {
          room: null,
          type: "game_not_found",
        });
        return;
      }

      rooms[room_code] = {
        game_info: {
          type: game_type,
          logic: game.logic,
          players_min: game.players.min,
          players_max: game.players.max,
          link: game.link,
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
        room: rooms[room_code],
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
          room: old_room,
          type: "old_room_exist",
        });
        return;
      }

      if (room_code in rooms) {
        if (rooms[room_code].is_in_game) {
          console.log("SH: room_is_in_game: ", room_code);
          socket.emit("unsuccess", {
            room: rooms[room_code],
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
          room: rooms[room_code],
          type: "joined_room",
        });

        io.to(room_code).emit("status_updated", {
          room: rooms[room_code],
          type: "player_joined",
        });
      } else {
        socket.emit("unsuccess", {
          room: null,
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
          room: null,
          type: "room_not_found",
        });
        return;
      }

      const player = room.players.find((p) => p.id == socket.id);

      if (!player) {
        console.log("SH: player_not_found:", socket.id);
        socket.emit("unsuccess", {
          room: room,
          type: "player_not_found",
        });
        return;
      }

      player.ready = true;

      socket.emit("success", {
        room: room,
        type: "player_ready",
      });

      io.to(room_code).emit("status_updated", {
        room: room,
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
      io.to(room_code).emit("status_updated", {
        room: room,
        type: "room_ready",
        link: room.game_info.link,
      });
      room.status = room.game_info.logic.status_init(room.status);
    });

    socket.on("complete_reconnection", (room_code) => {
      const room = rooms[room_code];
      if (!room) {
        console.log("SH: room_not_found: ", room_code);
        socket.emit("unsuccess", {
          room: null,
          type: "room_not_found",
        });
        return;
      }
      if (room.is_in_game) {
        console.log("SH: room_in_game: ", room_code);
        socket.emit("unsuccess", {
          room: room,
          type: "room_in_game",
        });
        return;
      }

      const player = room.players.find((p) => p.id == socket.id);

      if (!player) {
        console.log("SH: player_not_found:", socket.id);
        socket.emit("unsuccess", {
          room: room,
          type: "player_not_found",
        });
        return;
      }

      player.ready = true;

      socket.emit("success", {
        room: room,
        type: "player_ready",
      });

      io.to(room_code).emit("status_updated", {
        room: room,
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
      if (!room) {
        console.log("SH: room_not_found: ", room_code);
        socket.emit("unsuccess", {
          room: null,
          type: "room_not_found",
        });
        return;
      }

      const { result, reason } = room.game_info.logic.check_move(
        room.status,
        move,
      );

      if (!result) {
        socket.emit("unsuccess", {
          status: room.status,
          move: move,
          reason: reason,
          type: "submittion_not_applied",
        });
        return;
      }

      const new_status = room.game_info.logic.make_move(room.status, move);

      if (new_status == "exit_game") {
        exit_game(room_code);
        return;
      }

      room.status = new_status;

      socket.emit("success", {
        room: room.status,
        type: "submittion_applied",
      });

      io.to(room_code).emit("status_updated", {
        status: room.status,
        type: "player_moved",
      });
    });

    socket.on("exit_game", (data) => {
      exit_game(data.room_code);
    });

    //---end of the game---
    function exit_game(room_code) {
      console.log("SH: get_exit");

      const room = rooms[room_code];
      if (!room) {
        console.log("SH: room_not_found: ", room_code);
        socket.emit("unsuccess", {
          room: null,
          type: "room_not_found",
        });
        return;
      }

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

      const room = find_room_by_socket(socket.id);
      if (!room) {
        console.log("SH: room_not_found: ");
        socket.emit("unsuccess", {
          room: null,
          type: "room_not_found",
        });
        return;
      }

      if (room.is_transition_progress) {
        return;
      }

      if (!room.is_in_game) {
        exit_room(socket.id);
        return;
      }

      const player = room.players.find((p) => p.id == socket.id);
      if (!player) {
        console.log("SH: player_not_found: ", socket.id);
        socket.emit("unsuccess", {
          room: room,
          type: "player_not_found",
        });
        return;
      }

      player.ready = false;
      player.connection = false;

      room.status = room.game_info.logic.on_disconnected(
        room.status,
        socket.id,
      );

      room.disconnected = room.disconnected || {};
      room.disconnected[socket.id] = setTimeout(() => {
        remove_player_from_room(socket.id, room);
        exit_game(room.status.room_code);
      }, 30000);
    });

    //--reconnect--
    const { old_id, room_code } = socket.handshake.query;
    if (old_id) {
      console.log("SH: get_handshake");

      const room = rooms[room_code];
      if (!room) {
        console.log("SH: room_not_found: ", room_code);
        socket.emit("unsuccess", {
          room: null,
          type: "room_not_found",
        });
        return;
      }
      const player = room.players.find((p) => p.id == old_id);
      if (!player) {
        console.log("SH: player_not_found: ", old_id);
        socket.emit("unsuccess", {
          room: room,
          type: "player_not_found",
        });
        return;
      }

      const timeOut = room.disconnected[old_id];
      if (timeOut) clearTimeout(timeOut);

      player.connection = true;
      player.id = socket.id;

      const status_player = room.status.players.find((p) => p.id == old_id);
      if (status_player) {
        status_player.id = socket.id;
      }

      socket.join(room_code);
      socket.emit("success", {
        room: room,
        type: "id_updated",
      });

      if (room.is_in_game) {
        io.to(room_code).emit("status_updated", {
          status: room.status,
          type: "player_reconnected",
        });
      }

      console.log("SH: update_id", old_id, " => ", socket.id);
    }

    function exit_room(socket_id) {
      const room = find_room_by_socket(socket_id);
      if (!room) {
        console.log("SH: room_not_found: ");
        socket.emit("unsuccess", {
          room: null,
          type: "room_not_found",
        });
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

      io.to(room_code).emit("status_updated", {
        room: room,
        type: "player_exit",
      });

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
