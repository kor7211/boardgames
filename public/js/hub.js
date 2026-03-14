import { t } from "../i18n/i18n.js";
set_language();

let game = "";

const buttons = document.querySelectorAll(".game_select");
let user_name = localStorage.getItem("user_name");
const name_input = document.getElementById("user_name");
if (user_name) name_input.value.trim() = user_name;
user_name.addEventListener("change", () => {
  if(name_input.value.trim() == "") {
    name_input.value = t("no-name") + generate_randam_num();
  }
  user_name = name_input;
})

localStorage.removeItem("player_id");
localStorage.removeItem("game_type");
localStorage.removeItem("room_code");

buttons.forEach((button) => {
  button.addEventListener("click", (event) => {
    buttons.forEach(el => el.classList.remove("selected"));
    button.classList.add("selected");
    game = event.currentTarget.dataset.game;

    render_rule(game);
  });
});

function render_rule() {
  const rule = t(`rule.${game}`);
}

function on_ready() {
  if(user_name == "") {
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

function set_language() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}
