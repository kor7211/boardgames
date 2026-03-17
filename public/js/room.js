import { t } from "../i18n/i18n.js";
import { Common } from "./common.js";

const common = new Common();

const game_type = localStorage.getItem("game_type");
const user_name = localStorage.getItem("user_name");

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
  display_modal("join");
  overlay.onclick = () => {
    overlay.classList.add("hidden");
    overlay.onclick = null;
  };
};

const open_setting = document.getElementById("open_setting");
open_setting.onclick = () => {
  display_modal("setting");
  overlay.onclick = () => {
    overlay.classList.add("hidden");
    overlay.onclick = null;
  };
};

//===connect socket===
function change_modal(type) {
  document.querySelectorAll(`.room_modal`).forEach((m) => {
    m.classList.add("hidden");
  });

  document.getElementById(`${type}_modal`).classList.remove("hidden");
}
function update_player_list(room) {
  tbody.innerHTML = "";
  room.players.forEach((p) => {
    const name = p.name;
    const id = p.id;

    player_list.push(name);

    const list = document.getElementById("player_list");
    const tbody = list.querySelector("tbody");
    const tr = document.createElement("tr");
    tr.dataset.id = id;
    {
      const td = document.createElement("td");
      td.innerText = name;
      tr.appendChild(td);
    }
    {
      const td = document.createElement("td");
      td.innerText = p.ready ? t("ui.ready") : t("ui.not_ready");
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
}

function display_room_code(room_code) {
  const room_code_container = document.getElementById("room_code_container");
  room_code_container.innerHTML = "";
  const p = document.createElement("p");
  p.innerText = room_code;
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

  display_room_code(room.status.room_code);

  update_player_list(room);
  change_modal("room_wait");
}

function on_joined_room(room) {
  localStorage.setItem("player_id", socket.id);
  localStorage.setItem("room_code", room.status.room_code);

  display_room_code(room.status.room_code);

  update_player_list(room);
  change_modal("room_wait");
}

function on_user_ready(room) {}

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
    case "player_not_found":
      on_player_not_found(room);
      break;
  }
});

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
  socket.disconnect();
  window.location.href = "./../hub.html";
});

function set_language() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}
