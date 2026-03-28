module.exports = {
  //===init===
  status_init: (status) => {
    const new_status = { ...status };

    new_status.round = 1;
    new_status.does_wait = false;
    new_status.turn = "init";
    new_status.current_card = 0;
    new_status.card_target = null;
    new_status.card_target_record = null;
    new_status.cards_selected = [];

    new_status.players.forEach((player) => {
      player.cards = [1, 2, 3, 4, 5];
      player.cards_alive = [];
      player.card_selected = null;
      player.card_selected_record = null;
      player.point = 0;
      player.point_total = 0;
      player.can_move = false;
      player.ready = false;
      player.death = false;
      player.dead_round = false;
      player.place = null;
    });

    return new_status;
  },

  //===logic===
  make_move: (status, move) => {
    const new_status = { ...status };
    const player = new_status.players.find((p) => p.id == move.id);

    const emit_prop = {
      emit_all: false,
      detail: null,
    };

    switch (status.turn) {
      case "init":
        player.ready = true;
        if (!is_all_ready(new_status.players)) {
          new_status.does_wait = true;
          break;
        } else {
          emit_prop.emit_all = true;
          emit_prop.emit_detail = "turn_updated";
        }
        new_status.does_wait = false;
        new_status.players = all_not_ready(new_status.players);
        new_status.players = all_can_move(new_status.players, true);

        //init status
        new_status.round = 1;
        new_status.current_card = 0;
        new_status.card_target = null;
        new_status.card_target_record = null;
        new_status.cards_selected = [];
        new_status.players.forEach((player) => {
          player.cards = [1, 2, 3, 4, 5];
          player.cards_alive = [];
          player.card_selected = null;
          player.card_selected_record = null;
          player.point = 0;
          player.death = false;
          player.dead_round = false;
        });

        new_status.turn = "select";
        break;

      case "select":
        player.ready = true;
        if (!player.death) {
          player.card_selected = move.value;
          player.card_selected_record = move.value;
          player.cards = player.cards.filter((c) => c != move.value);
          player.dead_round = false;
        } else {
          player.card_selected = null;
        }
        if (!is_all_ready(new_status.players)) {
          new_status.does_wait = true;
          break;
        } else {
          new_status.does_wait = false;
          emit_prop.emit_all = true;
          emit_prop.emit_detail = "turn_updated";
        }
        new_status.players = all_not_ready(new_status.players);
        new_status.players = all_can_move(new_status.players, false);
        new_status.turn = "target";

        new_status.cards_selected = new_status.players
          .map((p) => p.card_selected)
          .filter(Boolean);
        new_status.cards_selected.sort((a, b) => a - b);
        new_status.card_min = new_status.cards_selected[0];

        break;
      case "target":
        player.ready = true;
        if (move.value) {
          new_status.card_target = move.value;
          new_status.card_target_record = move.value;
        }
        if (!is_all_ready(new_status.players)) {
          new_status.does_wait = true;
          break;
        } else {
          new_status.does_wait = false;
        }
        new_status.players = all_not_ready(new_status.players);

        /*

        new_status.card_min = new_status.cards_selected[0];
        const count = new_status.cards_selected.filter(
          (c) => c == new_status.card_min,
        ).length;
        new_status.cards_selected = new_status.cards_selected.filter(
          (c) => c != new_status.card_min,
        );

        if (new_status.card_target) {
          const players_dead = new_status.players.filter(
            (p) => p.card_selected == new_status.card_target,
          );
          players_dead.forEach((p) => {
            p.death = true;
            p.dead_round = true;
            p.card_selected = null;
          });
          new_status.cards_selected = new_status.cards_selected.filter(
            (c) => c != new_status.card_target,
          );
          new_status.card_target = null;
        }

        new_status.players.forEach((p) => {
          if (p.card_selected == new_status.card_min) {
            p.cards_alive.push(new_status.card_min);
          }
        });

        if (new_status.cards_selected.length == 0) {
          new_status.round++;
          const count = new_status.players.filter((p) => !p.death).length;

          new_status.players.forEach((p) => {
            p.card_selected = null;
          });

          if (new_status.round == 4 || count == 1) {
            new_status.players = all_can_move(new_status.players, false);
            new_status.turn = "point";
            break;
          }
          new_status.players = all_can_move(new_status.players, true);
          new_status.turn = "select";

          break;
        }

        if (count > 1) {
          new_status.players = all_can_move(new_status.players, false);
        } else {
          new_status.players = all_can_move(new_status.players, false);
          new_status.players.find(
            (p) => p.card_selected == new_status.card_min,
          ).can_move = true;
        }
        break;*/

        //check targetable player
        const count = new_status.cards_selected.filter(
          (c) => c == new_status.current_card,
        ).length;
        new_status.cards_selected = new_status.cards_selected.filter(
          (c) => c != new_status.current_card,
        );

        //kill targeted player
        if (new_status.card_target) {
          const players_dead = new_status.players.filter(
            (p) => p.card_selected == new_status.card_target,
          );
          players_dead.forEach((p) => {
            p.death = true;
            p.dead_round = true;
            p.card_selected = null;
          });
          new_status.cards_selected = new_status.cards_selected.filter(
            (c) => c != new_status.card_target,
          );
          new_status.card_target = null;
        }

        //alive targeter
        new_status.players.forEach((p) => {
          if (p.card_selected == new_status.current_card) {
            p.cards_alive.push(new_status.current_card);
          }
        });

        //end of target
        if (new_status.current_card == 5) {
          new_status.round++;
          const count = new_status.players.filter((p) => !p.death).length;

          new_status.players.forEach((p) => {
            p.card_selected = null;
          });

          emit_prop.emit_all = true;
          emit_prop.emit_detail = "turn_updated";
          if (new_status.round == 4 || count == 1) {
            new_status.players = all_can_move(new_status.players, false);
            new_status.turn = "point";
            break;
          }
          new_status.players = all_can_move(new_status.players, true);
          new_status.turn = "select";

          break;
        }

        //decide tageter
        new_status.players = all_can_move(new_status.players, false);
        if (count == 1) {
          new_status.players.find(
            (p) => p.card_selected == new_status.current_card,
          ).can_move = true;
        }

        new_status.current_card += 1;
        emit_prop.emit_all = true;
        emit_prop.emit_detail = "current_card_updated";
        break;

      case "point":
        player.ready = true;
        if (!is_all_ready(new_status.players)) {
          new_status.does_wait = true;
          break;
        } else {
          new_status.does_wait = false;
          emit_prop.emit_all = true;
          emit_prop.emit_detail = "turn_updated";
        }
        new_status.players = all_not_ready(new_status.players);

        for (const p of new_status.players) {
          p.point = null;
          if (p.death) continue;
          p.point = p.cards_alive.reduce((a, v) => a + v, 0);
          p.point_total += 1;
        }
        let points = new_status.players.map((p) => p.point).filter(Boolean);
        points = points.sort((a, b) => b - a);

        new_status.players
          .filter((p) => p.point == points[0])
          .forEach((p) => {
            p.point_total += 1;
          });

        new_status.turn = new_status.players.every((p) => p.point_total <= 4)
          ? "init"
          : "end";
        break;
      case "end":
        player.ready = true;
        if (!is_all_ready(new_status.players)) {
          new_status.does_wait = true;
          break;
        } else {
          emit_prop.emit_all = true;
          emit_prop.emit_detail = "turn_updated";
          new_status.does_wait = false;
        }
        new_status.players = all_not_ready(new_status.players);

        let place = 1;
        let counter = 0;
        let points_total = new_status.players
          .map((p) => p.point_total)
          .sort((a, b) => b - a);
        points_total = [...new Set(points_total)];
        for (const point of points_total) {
          for (const p of new_status.players) {
            if (p.point_total != point) continue;
            p.place = place;
            counter += 1;
          }
          place += counter;
          counter = 0;
        }
        new_status.turn = "result";
        break;
      case "result":
        player.ready = true;
        if (!is_all_ready(new_status.players)) {
          new_status.does_wait = true;
          break;
        } else {
          new_status.does_wait = false;
          emit_prop.emit_all = true;
          emit_prop.emit_detail = "turn_updated";
        }
        new_status.players = all_not_ready(new_status.players);

        new_status.turn = "back";
        break;
      case "back":
    }
    console.log("GM1: turn:", new_status.turn, " id: ", player.id);
    return { new_status, emit_prop };
  },

  check_move: (status, move) => {
    const new_status = { ...status };
    const player = new_status.players.find((p) => p.id == move.id);

    if (!player)
      return {
        result: false,
        reason: "player_not_found",
      };

    switch (new_status.turn) {
      case "select":
        const has_card = player.cards.includes(move.value);

        return {
          result: has_card,
          reason: "card_not_found",
        };
      case "target":
        console.log("game1: ", move.value, ",", new_status.current_card);
        if (player.can_move == false) {
          return {
            result: move.value == null,
            reason: "not_turn",
          };
        }
        return {
          result:
            player.card_selected == new_status.current_card &&
            new_status.card_min < move.value &&
            [1, 2, 3, 4, 5].includes(move.value),
          reason: "unable_card_selected",
        };
    }
    return {
      result: true,
      reason: "regard as empty sub",
    };
  },

  on_disconnected(status, id) {
    const new_status = { ...status };
    const player = new_status.players.find((p) => p.id == id);
    if (!player) return new_status;

    switch (new_status.turn) {
      case "select":
        if (!(player.death || !player.ready)) {
          player.cards.push(player.card_selected);
          player.card_selected = null;
          player.card_selected_record = null;
          player.can_move = true;
        } else {
          player.card_selected = null;
        }
        player.ready = false;
        break;
      case "target":
        if (!(player.death || !player.ready) && player.can_move) {
          new_status.card_target = null;
          new_status.card_target_record = null;
        }
        player.ready = false;
        break;
    }
    return new_status;
  },
};

function all_not_ready(players) {
  players.forEach((player) => {
    player.ready = false;
  });
  return players;
}

function all_can_move(players, is_true = true) {
  players.forEach((player) => {
    player.can_move = is_true;
  });
  return players;
}

function is_all_ready(players) {
  if (players.every((player) => player.ready)) {
    console.log("GM1: all_ready");
  } else {
    console.log("GM1: not_all_ready");
  }

  return players.every((player) => player.ready);
}
