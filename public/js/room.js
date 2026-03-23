import { t } from "../i18n/i18n.js";
import { Common } from "./common.js";

const common = new Common();

const game_type = localStorage.getItem("game_type");
const user_name = localStorage.getItem("user_name");
const rule = t(`rule.${game_type}`);
if (rule) common.render_rule(rule, `rule.${game_type}`);

const socket = io();

//----
let player_list = [];

//===onclick===
const open_exit = document.getElementById("open_exit");
const close_exit = document.getElementById("close_exit");
open_exit.onclick = () => {
  common.display_modal("exit", false);
};
close_exit.onclick = () => {
  document.getElementById("overlay").classList.add("hidden");
};

const open_join = document.getElementById("open_join");
open_join.onclick = () => {
  common.display_modal("join");
};

const open_setting = document.getElementById("open_setting");
open_setting.onclick = () => {
  common.display_modal("setting");
};

//===connect socket===
function change_modal(type) {
  document.querySelectorAll(`.room-modal`).forEach((m) => {
    m.classList.add("hidden");
  });

  document.getElementById(`${type}_modal`).classList.remove("hidden");
}
function update_player_list(room) {
  console.log(room);
  const list = document.getElementById("player_list");
  list.innerHTML = "";
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  player_list = [];

  let ready_num = 0;
  room.players.forEach((p) => {
    const name = p.name;
    const id = p.id;

    player_list.push(name);

    const tr = document.createElement("tr");
    tr.dataset.id = id;
    {
      const td = document.createElement("td");
      td.innerText = name;
      td.classList.add("td--name");
      tr.appendChild(td);
    }
    {
      const td = common.set_i18n(
        document.createElement("td"),
        p.ready ? "ui.ready" : "ui.not_ready",
      );
      if (p.ready) {
        ready_num += 1;
      }
      td.classList.add("td--ready");
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
    table.appendChild(tbody);
    list.appendChild(table);
  });

  const player_num = document.createElement("p");
  player_num.id = "player_num";
  player_num.innerText = `${ready_num} / ${player_list.length}`;
  list.appendChild(player_num);
}

function display_room_code(room_code) {
  const room_code_container = document.getElementById("room_code_container");
  room_code_container.innerHTML = "";
  const p = document.createElement("p");
  p.appendChild(
    common.set_i18n(document.createElement("span"), "ui.room_code"),
  );
  const span = document.createElement("span");
  span.innerText = ` : ${room_code}`;
  p.appendChild(span);
  room_code_container.appendChild(p);
}

//--creat_room--
const create_room = document.getElementById("create_room");
create_room.onclick = () => {
  socket.emit("create_room", game_type, user_name);
};

const join_room = document.getElementById("join_room");
join_room.onclick = () => {
  const room_code = document.getElementById("room_code").value.trim();
  socket.emit("join_room", room_code, user_name);

  overlay.classList.add("hidden");
  overlay.onclick = null;
};

const ready = document.getElementById("ready");
ready.onclick = () => {
  const room_code = localStorage.getItem("room_code");
  socket.emit("ready", room_code);

  console.log("try ready");
};

const exit_room = document.getElementById("exit_room");
exit_room.onclick = () => {
  socket.emit("exit_room");
};

socket.on("success", ({ room, type }) => {
  if (type == null) return;

  switch (type) {
    case "room_created":
      on_room_created(room);
      break;
    case "joined_room":
      on_joined_room(room);
      break;
    case "player_ready":
      on_user_ready(room);
      break;
    case "id_updated":
      on_id_updated(room);
      break;
  }
});

function on_room_created(room) {
  localStorage.setItem("player_id", socket.id);
  localStorage.setItem("room_code", room.status.room_code);

  const ready = document.getElementById("ready");
  ready.classList.add("able");
  ready.classList.remove("hidden");

  display_room_code(room.status.room_code);

  update_player_list(room);
  change_modal("room_wait");
}

function on_joined_room(room) {
  localStorage.setItem("player_id", socket.id);
  localStorage.setItem("room_code", room.status.room_code);

  const ready = document.getElementById("ready");
  ready.classList.add("able");
  ready.classList.remove("hidden");

  display_room_code(room.status.room_code);

  update_player_list(room);
  change_modal("room_wait");
}

function on_user_ready(room) {
  const ready = document.getElementById("ready");
  ready.classList.remove("able");
}

function on_id_updated(room) {}

socket.on("unsuccess", ({ room, type }) => {
  if (type == null) return;

  switch (type) {
    case "old_room_exist":
      on_old_room_exist(room);
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
  }
});

function on_old_room_exist(room) {
  common.set_i18n(document.getElementById("message"), "error.old_room_exist");
  const button = document.getElementById("message_button");
  button.classList.remove("hidden");
  button.onclick = () => {
    button.classList.add("hidden");
    socket.emit("exit_room");
  };
  common.display_modal("message", false);
}

function on_game_not_found() {
  common.set_i18n(document.getElementById("message"), "error.game_not_found");
  const button = document.getElementById("message_button");
  button.classList.remove("hidden");
  button.onclick = () => {
    button.classList.add("hidden");
    back_hub();
  };
  common.display_modal("message", false);
}

function on_room_in_game(room) {
  common.set_i18n(document.getElementById("message"), "error.room_in_game");
  common.display_modal("message");
}

function on_room_not_found() {
  common.set_i18n(document.getElementById("message"), "error.room_not_found");
  const button = document.getElementById("message_button");
  button.classList.remove("hidden");
  button.onclick = () => {
    button.classList.add("hidden");
    back_hub();
  };
  common.display_modal("message", false);
}

function on_code_not_found() {
  common.set_i18n(document.getElementById("message"), "error.code_not_found");
  common.display_modal("message");
}

function on_player_not_found(room) {
  common.set_i18n(document.getElementById("message"), "error.player_not_found");
  const button = document.getElementById("message_button");
  button.classList.remove("hidden");
  button.onclick = () => {
    button.classList.add("hidden");
    socket.emit("exit_room");
  };
  common.display_modal("message", false);
}

socket.on("status_updated", ({ room, type }) => {
  if (type == null) return;

  switch (type) {
    case "player_joined":
      on_player_joined(room);
      break;
    case "player_ready":
      on_player_ready(room);
      break;
    case "room_ready":
      on_room_ready(room);
      break;
    case "player_exit":
      on_player_exit(room);
      break;
  }
});

function on_player_joined(room) {
  update_player_list(room);
}

function on_player_ready(room) {
  update_player_list(room);
}

function on_room_ready(room) {
  window.location.href = room.game_info.link;
}

function on_player_exit(room) {
  update_player_list(room);
}

socket.on("exit_room", () => {
  back_hub();
});

function back_hub() {
  socket.disconnect();
  window.location.href = "./../hub.html";
}
