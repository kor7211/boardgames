import { t } from "../i18n/i18n.js";

const game_type = localStorage.getItem("game_type");
const user_name = localStorage.getItem("user_name");

const socket = io();

//----
let player_list = [];

//===onclick===
//--open modal--
const overlay = document.getElementById("overlay");
function display_modal(type) {
  overlay.classList.remove("hidden");

  document.querySelectorAll(`.modal`).forEach((m) => {
    m.classList.add("hidden");
  });

  document.getElementById(`${type}_modal`).classList.remove("hidden");
}

const open_exit = document.getElementById("open_exit");
const close_exit = document.getElementById("close_exit");
open_exit.onclick = () => {
  display_modal("exit");
};
close_exit.onclick = () => {
  overlay.classList.add("hidden");
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
function add_player_list(name) {
  if (name in player_list) return;

  player_list.push(name);

  const list = document.getElementById("player_list");
  const tbody = list.querySelector("tbody");
  const tr = document.createElement("tr");
  tr.dataset.name = name;
  {
    const td = document.createElement("td");
    td.innerText = name;
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}
function remove_player_list(name) {
  if (!(name in player_list)) return;

  player_list.filter((p) => p != name);

  const list = document.getElementById("player_list");
  const tbody = list.querySelector("tbody");
  const tr = tbody.querySelectorAll("tr").find((el) => el.dataset.name == name);
  if (tr) tr.remove();
}

//--creat_room--
const create_room = document.getElementById("create_room");
create_room.onclick = () => {
  socket.emit("create_room", game_type, user_name);
};
socket.on("room_created", ({ room_code, game_type, socket_id }) => {
  localStorage.setItem("player_id", socket_id);
  localStorage.setItem("room_code", room_code);

  const room_code_container = document.getElementById("room_code_container");
  room_code_container.innerHTML = "";
  const p = document.createElement("p");
  p.innerText = room_code;
  room_code_container.appendChild(p);

  add_player_list(user_name);
  change_modal("room_wait");

  console.log("successfully created");
  console.log("部屋:", room_code);
  console.log("game:", game_type);
});

const join_room = document.getElementById("join_room");
join_room.onclick = () => {
  const room_code = document.getElementById("room_code").value.trim();
  socket.emit("join_room", room_code, user_name);
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

socket.on("room_joined", ({ room_code, game_type, socket_id }) => {
  localStorage.setItem("player_id", socket_id);
  localStorage.setItem("room_code", room_code);

  console.log("successfully joined");
  console.log("部屋:", room_code);
  console.log("game:", game_type);
});

socket.on("room_not_joined", () => {
  console.log("unsuccess_join");
});

socket.on("room_ready", (url) => {
  window.location.href = url;
});

socket.on("exit_room", () => {
  socket.disconnect();
  window.location.href = "./../hub.html";
});

socket.on("player_exit", (room) => {
  console.log("player_exit");
});

function set_language() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}
