import { render, enable_submit, success_submit, set_exit } from "./render.js";

const old_id = localStorage.getItem("player_id");
const room_code = localStorage.getItem("room_code");
const socket = io({ query: { old_id, room_code } });

socket.emit("complete_reconnection", room_code);

let user_input = "";

socket.on("update_id", (socket_id) => {
  localStorage.setItem("player_id", socket_id);

  console.log("id: ", socket_id);
});

function handle_submittion(data) {
  user_input = data.input;
  on_submit(data.room_code);
}

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
  console.log("try_submit");
  const data = {
    room_code: room_code,
    submittion: {
      id: socket.id,
      value: user_input,
    },
  };
  socket.emit("player_try", data);
}

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
