const buttons = document.querySelectorAll(".game_select");
let user_name = localStorage.getItem("user_name");
if (user_name) document.getElementById("user_name").value = user_name;

localStorage.removeItem("player_id");
localStorage.removeItem("game_type");
localStorage.removeItem("room_code");

buttons.forEach((button) => {
  button.addEventListener("click", (event) => {
    on_game_selected(event.currentTarget.dataset.game); // dataset のキー名を指定
  });
});

function on_game_selected(game_type) {
  user_name = document.getElementById("user_name").value.trim();
  if (!user_name) {
    user_name = "no-name" + generate_randam_num();
  }

  localStorage.setItem("game_type", game_type);
  localStorage.setItem("user_name", user_name);
  window.location.href = "/room.html";
  //usernameも作る
}

function generate_randam_num() {
  const num = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return num;
}
