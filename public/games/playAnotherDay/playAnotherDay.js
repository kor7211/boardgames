import { render } from "./render.js";

//===reconnect===
const old_id = localStorage.getItem("player_id");
const room_code = localStorage.getItem("room_code");
const socket = io({ query: { old_id, room_code } });

socket.emit("complete_reconnection", room_code);

//===connect to SH===
//--init--
socket.on("init", (status) => {
  console.log("init: ", status);
  render(make_data(status, "status_updated", "init", true, true));
});
//--success--
socket.on("success", ({ room, status, type }) => {
  console.log("success: ", status, type);
  if (type == null) return;
  let data = null;
  switch (type) {
    case "submittion_applied":
      data = make_data(status, "success", type, true, false);
      on_submittion_applied(status);
      break;
    case "id_updated":
      on_id_updated(status);
      break;
  }
  if (data != null) render(data);
});

function on_submittion_applied(status) {}

function on_id_updated(status) {
  localStorage.setItem("player_id", socket.id);
  console.log("id: ", socket.id);
}

//--unsuccess--
socket.on("unsuccess", ({ room, status, type, reason, move }) => {
  if (type == null) return;

  let data = null;
  switch (type) {
    case "old_room_exist":
      localStorage.setItem("error_type", type);
      back_to_hub();
      break;
    case "game_not_found":
      localStorage.setItem("error_type", type);
      back_to_hub();
      break;
    case "room_in_game":
      localStorage.setItem("error_type", type);
      back_to_hub();
      break;
    case "room_not_found":
      localStorage.setItem("error_type", type);
      back_to_hub();
      break;
    case "code_not_found":
      localStorage.setItem("error_type", type);
      back_to_hub();
      break;
    case "player_not_found":
      localStorage.setItem("error_type", type);
      back_to_hub();
      break;
    case "submittion_not_applied":
      data = make_data(status, "unsuccess", type, true, false);
      on_submittion_not_applied({ status: status, reason: reason, move: move });
      break;
  }
  if (data != null) render(data);
});

function on_submittion_not_applied({ status, reason, move }) {}

//--status updated
socket.on("status_updated", ({ status, detail, type }) => {
  if (type == null) return;

  let data = null;
  switch (type) {
    case "player_reconnected":
      data = make_data(status, "status_updated", type, true, false);
      on_player_reconnected(status);
      break;
    case "player_moved":
      console.log("detail: ", detail);
      const player = status.players.find((p) => p.id === socket.id);
      if (detail == "turn_updated") {
        data = make_data(
          status,
          "status_updated",
          type,
          true,
          !player.can_move,
        );
      } else if (detail == "current_card_updated") {
        data = make_data(
          status,
          "status_updated",
          type,
          true,
          !player.can_move,
        );
      }
      on_player_moved(status);
      break;
  }
  if (data != null) render(data);
});

function on_player_reconnected(status) {}

function on_player_moved(status) {}
//--exit--
socket.on("exit_game", () => {
  back_to_hub();
});

function back_to_hub() {
  window.location.href = "./../../hub.html";
}

//== usefull functions ==
function empty_submit(status) {
  const data = {
    room_code: status.room_code,
    move: {
      id: socket.id,
      value: null,
    },
  };

  socket.emit("player_move", data);
}

function make_data(
  status,
  type,
  detail,
  able_exit_game = false,
  able_on_end_render = false,
) {
  return {
    status: status,
    id: socket.id,
    type: type,
    detail: detail,
    functions: {
      exit_game: {
        function: exit_game,
        able: able_exit_game,
      },
      on_end_render: {
        function: on_end_render,
        able: able_on_end_render,
      },
      on_submit: {
        function: on_submit,
        able: status.players.find((p) => p.id == socket.id).can_move,
      },
    },
  };
}

//== given functions for render ==
function exit_game(status) {
  socket.emit("exit_game", { room_code: status.room_code });
}

function on_submit({ status, user_input }) {
  console.log("submit");
  const data = {
    room_code: status.room_code,
    move: {
      id: socket.id,
      value: user_input,
    },
  };
  socket.emit("player_move", data);
}

function on_end_render(status) {
  switch (status.turn) {
    case "init":
      empty_submit(status);
      break;
    case "target":
      if (status.players.find((p) => p.id === socket.id).can_move == false) {
        empty_submit(status);
      }
  }
}
