import { t } from "../../i18n/i18n.js";
import { Common } from "../../js/common.js";

const common = new Common();
common.render_rule("rule.game1");

//== const Element ==
const score_board = document.getElementById("score_board");
const targeter = document.getElementById("targeter");
const hands_user = document.getElementById("hands_user");
const player_fields = document.querySelectorAll(`.player_field`);
const center_field = document.querySelector(`.center_field`);

const submit = document.getElementById("submit");
let input = null;

const overlay = document.getElementById("overlay");

const open_score = document.getElementById("open_score");
open_score.onclick = () => {
  common.display_modal("score", true);
};

const open_exit = document.getElementById("open_exit");
const exit = document.getElementById("exit");
const close_exit = document.getElementById("close_exit");
open_exit.onclick = () => {
  common.display_modal("exit", false);
  close_exit.onclick = () => {
    overlay.classList.add("hidden");
  };
};

//Valiables
let player_list = [];

//saurce
const image_map = {
  card_back: "/images/game1/playAnotherDay_card_back.png",
  card_1: "/images/game1/playAnotherDay_card_1.png",
  card_2: "/images/game1/playAnotherDay_card_2.png",
  card_3: "/images/game1/playAnotherDay_card_3.png",
  card_4: "/images/game1/playAnotherDay_card_4.png",
  card_5: "/images/game1/playAnotherDay_card_5.png",
  card_order: "/images/game1/playAnotherDay_card_order.png",
  card_order_1: "/images/game1/playAnotherDay_card_order_1.png",
  card_order_2: "/images/game1/playAnotherDay_card_order_2.png",
  card_order_3: "/images/game1/playAnotherDay_card_order_3.png",
  card_order_4: "/images/game1/playAnotherDay_card_order_4.png",
  card_order_5: "/images/game1/playAnotherDay_card_order_5.png",
};

export function render({ status, id, type, detail, functions, move_detail }) {
  if (functions.exit_game.able) {
    exit.onclick = null;
    exit.onclick = () => {
      functions.exit_game.function({
        status: status,
      });
    };
    exit.classList.add("able");
  } else {
    exit.onclick = null;
    exit.classList.remove("able");
  }

  if (functions.on_submit.able) {
    submit.onclick = null;
    submit.onclick = () => {
      functions.on_submit.function({
        status: status,
        user_input: input,
      });
    };
    submit.classList.add("able");
  } else {
    submit.onclick = null;
    submit.classList.remove("able");
  }

  const user = status.players.find((p) => p.id == id);
  if (!user) {
    console.log("render: player_not_found");
    return;
  }

  const data = {
    status: status,
    user: user,
  };

  switch (type) {
    case "success":
      switch (detail) {
        case "submittion_applied":
          switch (status.turn) {
            case "select":
              render_my_hands(data);
              break;
            case "target":
              overlay.classList.add("hidden");
          }
          break;
        case "id_updated":
          break;
      }
      break;

    case "unsuccess":
      switch (detail) {
        case "submittion_not_applied":
          break;
      }
      break;

    case "status_updated":
      switch (detail) {
        case "init":
          common.set_language();
          break;
        case "player_reconnected":
          break;
        case "player_moved":
          console.log(move_detail);
          switch (move_detail) {
            case "turn_updated":
            case "current_card_updated":
              init_player_fields(data);
              render_score_board(data);
              render_card_order(data);

              switch (status.turn) {
                case "init":
                  break;
                case "select":
                  render_select_table(data);
                  render_my_hands(data);
                  break;
                case "target":
                  render_target_table(data);
                  render_my_hands(data);
                  if (user.can_move) render_targeter(data);
                  break;
                case "point":
                  break;
                case "end":
                  break;
                case "back":
                  break;
              }
              break;
            case "card_selected":
              init_player_fields(data);
              render_score_board(data);
              render_select_table(data);
              break;
          }
          break;
      }
      break;
  }
  if (functions.on_end_render.able) {
    console.log("emptysub : ", status);
    functions.on_end_render.function(status);
  }
}

//--render function--
function render_score_board(data) {
  score_board.innerHTML = "";

  const user = data.user;

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  //--TableHead--
  const tr = document.createElement("tr");

  function make_th(value, class_name) {
    const th = common.set_i18n(document.createElement("th"), value);
    th.classList.add(class_name);

    tr.appendChild(th);
  }
  make_th("ui.user_name", "user_name");
  make_th("ui.point", "point");
  make_th("ui.game1.tip", "tip");
  make_th("ui.ready", "ready");

  thead.appendChild(tr);

  table.appendChild(thead);

  //--TableBody--
  for (const p of player_list) {
    if (!p) continue;

    const tr = document.createElement("tr");
    tr.classList.add("score");
    if (p.unique_id == user.unique_id) {
      tr.classList.add("user");
    } else {
      tr.classList.add("opponent");
    }

    function make_td(value, class_name) {
      const td = document.createElement("td");
      td.innerText = value;
      td.classList.add(class_name);

      tr.appendChild(td);
    }

    make_td(p.name, "user_name");
    make_td(
      p.cards_alive.length > 1
        ? `${p.cards_alive.sort((a, b) => a - b).join("+")} = ${p.cards_alive.reduce((a, v) => (a += v))}`
        : p.cards_alive.length > 0
          ? `${p.cards_alive.reduce((a, v) => (a += v))}`
          : "0",
      "point",
    );
    make_td(p.point_total, "tip");
    make_td(p.ready ? "ready" : "...", "ready");

    if (p.death) tr.classList.add("dead");

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  score_board.appendChild(table);
}

function render_card_order(data) {
  center_field.innerHTML = "";

  const status = data.status;

  let div;
  if (status.turn == "target" && Boolean(status.current_card)) {
    div = make_card({
      owner: "table",
      image:
        status.current_card != 0
          ? image_map[`card_order_${status.current_card}`]
          : image_map["card_order"],
      strength: status.current_card,
    });
  } else {
    div = make_card({
      owner: "table",
      image: image_map["card_order"],
      strength: 0,
    });
  }
  div.classList.add("order");

  center_field.appendChild(div);
}

function render_my_hands(data) {
  hands_user.innerHTML = "";

  const status = data.status;
  const user = data.user;
  user.cards.sort((a, b) => a - b);
  user.cards.forEach((card) => {
    const image_path = image_map["card_" + card];

    const div = make_card({
      owner: user.unique_id,
      image: image_path,
      strength: card,
    });

    if (user.can_move && status.turn == "select" && !user.ready) {
      div.classList.add("hands", "able");
      div.addEventListener("click", (event) => {
        update_card_selected(event.currentTarget, card);
      });
    }
    hands_user.appendChild(div);
  });
}

function render_select_table(data) {
  player_fields.forEach((el) => {
    el.innerHTML = "";
  });

  const status = data.status;
  const user = data.user;

  let divs = null;
  player_list.forEach((p) => {
    if (p.unique_id == user.unique_id) {
      console.log("rst: user: ", p.card_selected);
      divs = make_board_card({
        player: p,
        strength: p.card_selected ?? 0,
        is_empty: !(p.ready && !p.death),
      });
    } else {
      console.log("rst: player: ");
      divs = make_board_card({
        player: p,
        strength: 0,
        is_empty: !(p.ready && !p.death),
      });
    }

    document
      .querySelector(`.player_field[data-owner="${p.unique_id}"]`)
      .appendChild(divs.div_info);
    document
      .querySelector(`.player_field[data-owner="${p.unique_id}"]`)
      .appendChild(divs.div_card);
  });
}

function render_target_table(data) {
  player_fields.forEach((el) => {
    el.innerHTML = "";
  });

  const status = data.status;

  player_list.forEach((p) => {
    let divs;
    if (p.death && !p.dead_round) {
      divs = make_board_card({
        player: p,
        strength: 0,
        is_empty: true,
      });
      divs.classList.add("invisible");
    } else if (p.dead_round) {
      divs = make_board_card({
        player: p,
        strength: p.card_selected_record,
        is_empty: false,
      });
      divs.div_card.classList.add("targeted");
    } else if (status.current_card == p.card_selected_record) {
      divs = make_board_card({
        player: p,
        strength: p.card_selected_record,
        is_empty: false,
      });
      divs.div_card.classList.add("hunting");
    } else if (status.current_card > p.card_selected_record) {
      divs = make_board_card({
        player: p,
        strength: p.card_selected_record,
        is_empty: false,
      });
    } else {
      divs = make_board_card({
        player: p,
        strength: 0,
        is_empty: false,
      });
    }

    document
      .querySelector(`.player_field[data-owner = "${p.unique_id}"]`)
      .appendChild(divs.div_info);
    document
      .querySelector(`.player_field[data-owner = "${p.unique_id}"]`)
      .appendChild(divs.div_card);
  });
}

function render_targeter(data) {
  targeter.innerHTML = "";

  const user = data.user;
  const status = data.status;

  const button = document.getElementById("submit_targeter");

  function update_submit(enable = false) {
    if (enable) {
      button.classList.add("able");
      button.onclick = () => {
        submit.click();
      };
    } else {
      button.classList.remove("able");
    }
  }

  for (let i = 1; i < 6; i++) {
    const div = make_card({
      image: image_map["card_" + i],
      owner: "targeter",
      strength: i,
    });
    div.classList.add("targeter");
    if (i <= status.card_min) {
      div.addEventListener("click", () => {
        update_card_selected();
        update_submit(false);
      });
    } else {
      div.addEventListener("click", (event) => {
        update_card_selected(event.currentTarget, i);
        update_submit(true);
      });
      div.classList.add("able");
    }
    targeter.appendChild(div);
  }
  common.display_modal("targeter", false);
}
//--make function--
function make_card(card) {
  const div = document.createElement("div");
  div.classList.add("card");
  div.style.backgroundImage = `url(${card.image})`;
  div.dataset.owner = card.owner;
  div.dataset.strength = card.strength == 0 ? null : card.strength;
  return div;
}

function make_board_card(data) {
  const player = data.player;
  const strength = data.strength;
  const is_empty = data.is_empty;

  const div_info = document.createElement("div");
  div_info.classList.add("player_info");
  {
    const span = document.createElement("span");
    span.classList.add("user_name");
    span.innerText = player.name;

    div_info.appendChild(span);
  }
  {
    const span = document.createElement("span");
    span.classList.add("tip");
    span.innerText = `(${player.point_total}/5)`;

    div_info.appendChild(span);
  }

  const div_card = make_card({
    image:
      strength == 0 ? image_map["card_back"] : image_map["card_" + strength],
    owner: player.unique_id,
    strength: strength,
  });

  if (is_empty) div_card.classList.add("invisible");

  return {
    div_card: div_card,
    div_info: div_info,
  };
}

//--update function--
function init_player_fields({ status, user }) {
  let players = status.players.sort((a, b) => a.unique_id - b.unique_id);
  const user_index = players.map((p) => p.unique_id).indexOf(user.unique_id);
  player_list = [...players.slice(user_index), ...players.slice(0, user_index)];

  player_fields.forEach((el) => {
    el.classList.add("hidden");
  });

  let counter = 1;
  for (const player of player_list) {
    const field = document.querySelector(`.player_field.p${counter}`);
    console.log("render: field: ", field);

    field.classList.remove("hidden");
    field.classList.add("enable");
    field.dataset.owner = player.unique_id;
    counter++;
  }
  table.classList.add(`players_${player_list.length}`);
}

function update_card_selected(card = null, strength = null) {
  const cards = document.getElementsByClassName("card");
  for (const c of cards) {
    c.classList.remove("selected");
  }
  if (strength) {
    card.classList.add("selected");
    submit.classList.add("able");

    input = strength;
  } else {
    submit.classList.remove("able");

    input = null;
  }
}

//--submit--
/*
export function enable_submit(enable, func = null, room_code = null) {
  if (enable) {
    submit.onclick = () => {
      func({
        input: input,
        room_code: room_code,
      });
    };
    submit.classList.remove("disable");
    submit.disabled = false;
  } else {
    submit.onclick = null;
    submit.classList.add("disable");
    submit.disabled = true;
  }
}*/

//--language--

//--sleep--
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
