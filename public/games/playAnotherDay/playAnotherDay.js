import { render, enable_submit, success_submit, set_exit } from "./render.js";

//===reconnect===
const old_id = localStorage.getItem("player_id");
const room_code = localStorage.getItem("room_code");
const socket = io({ query: { old_id, room_code } });

socket.emit("complete_reconnection", room_code);

//--init--
socket.on("init", (status) => {
  const my_status = status.players.find((p) => p.id == socket.id);

  //表示を更新
  console.log("init: ", my_status);

  set_exit(exit_game, status);
  empty_submit(status);
});

function exit_game(status) {
  socket.emit("exit_game", { room_code: status.room_code });
}

//===connect to SH===
socket.on("success", ({ status, type }) => {
  if (type == null) return;

  switch (type) {
    case "submittion_applied":
      on_submittion_applied(status);
      break;
    case "id_updated":
      on_id_updated(status);
      break;
    case "player_ready":
      on_player_ready(status);
  }
});
function on_submittion_applied(status) {}

function on_id_updated(status) {
  localStorage.setItem("player_id", socket.id);

  console.log("id: ", socket.id);
}

function on_player_ready(status) {}
socket.on("unsuccess", ({ room, status, type, reason, move }) => {
  if (type == null) return;

  switch (type) {
    case "old_room_exist":
      on_old_room_exist();
      break;
    case "game_not_found":
      on_game_not_found();
      break;
    case "room_in_game":
      on_room_in_game(room);
      break;
    case "room_not_found":
      on_room_not_found();
      break;
    case "code_not_found":
      on_code_not_found();
      break;
    case "player_not_found":
      on_player_not_found(room);
      break;
    case "submittion_not_applied":
      on_submittion_not_applied({ status: status, reason: reason, move: move });
      break;
  }
});

function on_old_room_exist() {
  const message = document.getElementById("message");
  message.innerText = t("error.old_room_exist");
  const button = document.getElementById("message_button");
  button.classList.remove("hidden");
  button.onclick = () => {
    button.classList.add("hidden");
    socket.emit("exit_room");
  };
  common.display_modal("message", false);
}

function on_game_not_found() {
  const message = document.getElementById("message");
  message.innerText = t("error.game_not_found");
  const button = document.getElementById("message_button");
  button.classList.remove("hidden");
  button.onclick = () => {
    button.classList.add("hidden");
    back_hub();
  };
  common.display_modal("message", false);
}

function on_room_in_game(room) {
  const message = document.getElementById("message");
  message.innerText = t("error.room_in_game");
  common.display_modal("message");
}

function on_room_not_found() {
  const message = document.getElementById("message");
  message.innerText = t("error.room_not_found");
  const button = document.getElementById("message_button");
  button.classList.remove("hidden");
  button.onclick = () => {
    button.classList.add("hidden");
    back_hub();
  };
  common.display_modal("message", false);
}

function on_code_not_found() {
  const message = document.getElementById("message");
  message.innerText = t("error.room_not_found");
  common.display_modal("message");
}

function on_player_not_found(room) {
  const message = document.getElementById("message");
  message.innerText = t("error.player_not_found");
  const button = document.getElementById("message_button");
  button.classList.remove("hidden");
  button.onclick = () => {
    button.classList.add("hidden");
    socket.emit("exit_room");
  };
  common.display_modal("message", false);
}

function on_submittion_not_applied({ status, reason, move }) {}

socket.on("status_updated", ({ status, type }) => {
  if (type == null) return;

  switch (type) {
    case "player_reconnected":
      on_player_reconnected(status);
      break;
    case "player_moved":
      on_player_moved(status);
      break;
  }
});

let user_input = "";

function handle_submittion(data) {
  user_input = data.input;
  on_submit(data.room_code);
}

socket.on("update_state", async (status) => {
  const my_status = status.players.find((p) => p.id == socket.id);

  //ui update
  render(status, my_status.id);

  if (status.does_wait) return;

  console.log("my_status: ", my_status);
  console.log("current_turn: ", status.turn);

  //すでにreadyの場合
  if (my_status.ready) {
    return;
  }
  //死んでたらここで止める
  if (my_status.death) {
    empty_submit(status);
    return;
  }

  switch (status.turn) {
    case "init":
      empty_submit(status);
      break;
    case "select":
      console.log("can_select");
      enable_submit(true, handle_submittion, status.room_code);
      break;
    case "target":
      if (!my_status.can_move) {
        empty_submit(status);
        break;
      }
      console.log("can_target");
      enable_submit(true, handle_submittion, status.room_code);
      break;
    case "point":
      empty_submit(status);
      break;
    case "end":
      empty_submit(status);
      break;
    case "result":
      empty_submit(status);
      break;
    case "back":
      empty_submit(status);
      break;
  }
});

socket.on("exit_game", () => {
  window.location.href = "./../../hub.html";
});

function empty_submit(status) {
  const data = {
    room_code: status.room_code,
    move: {
      id: socket.id,
      type: status.turn,
      value: null,
    },
  };

  console.log("empty_submit: ", data.move.type);

  socket.emit("player_move", data);
}
function on_submit(room_code) {
  console.log("submit");
  const data = {
    room_code: room_code,
    move: {
      id: socket.id,
      type: status.turn,
      value: user_input,
    },
  };
  socket.emit("player_move", data);
}

/*
socket.on("can_submit", ({ can_submit, status, submittion }) => {
  if (can_submit) {
    const data = {
      room_code: status.room_code,
      move: {
        id: socket.id,
        type: status.turn,
        value: submittion.value,
      },
    };
    socket.emit("player_move", data);
    console.log("success_submit: ", submittion.value);
    success_submit(true);
    enable_submit(false);
  } else {
    console.log("unsuccess_submit: ", submittion.value);
    user_input = "";
    success_submit(false);
  }
});
*/
