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
    name_input.value = t("no-name") + generate_randam_num();
  }
  user_name = name_input;
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
    const rule = t(`rule.${game}`);
    common.render_rule(rule);
  });
});

function on_ready() {
  if (!game) return;

  if (user_name == "") {
    user_name = t("no-name") + generate_randam_num();
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
