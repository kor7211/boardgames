import { t } from "../i18n/i18n.js";
import { Common } from "./common.js";

const common = new Common();

let game = "";

localStorage.removeItem("player_id");
localStorage.removeItem("game_type");
localStorage.removeItem("room_code");

const ready = document.getElementById("ready");
ready.addEventListener("click", on_ready);

let user_name = localStorage.getItem("user_name");
const name_input = document.getElementById("user_name");
if (user_name) name_input.value = user_name;
name_input.addEventListener("change", () => {
  if (name_input.value.trim() == "") {
    name_input.placeholder = t("no-name") + generate_randam_num();
  }
  user_name = name_input.value.trim();
});

const selects = document.querySelectorAll(".game-select");
selects.forEach((select) => {
  const div = document.createElement("div");
  //div.style.backgroundImage = `url(../images/${select.dataset.game}/icon)`;
  select.appendChild(div);
  select.addEventListener("click", (event) => {
    selects.forEach((el) => el.classList.remove("selected"));
    select.classList.add("selected");
    game = event.currentTarget.dataset.game;

    ready.classList.add("able");
    common.render_rule(t(`rule.${game}`), `rule.${game}`);
  });
});

const error = localStorage.getItem("error_type");
if (error) {
  const message = document.getElementById("message");
  common.set_i18n(message, `error.${error}`);
  const button = document.getElementById("message_button");
  button.classList.remove("hidden");
  button.onclick = () => {
    button.classList.add("hidden");
    const overlay = document.getElementById("overlay");
    overlay.classList.add("hidden");
  };
  common.display_modal("message", false);
}
localStorage.removeItem("error_type");

function on_ready() {
  if (!game) return;

  if (user_name == "") {
    user_name = name_input.placeholder;
  }
  localStorage.setItem("game_type", game);
  localStorage.setItem("user_name", user_name);
  window.location.href = "/room.html";
}

function generate_randam_num() {
  const num = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return num;
}
