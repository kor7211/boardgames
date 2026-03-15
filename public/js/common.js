import { t } from "../i18n/i18n.js";

export class Common {
  constructor() {
    this.overlay = document.getElementById("overlay");
    this.set_language();
    this.open_setting = document.getElementById("open_setting");
    if (this.open_setting == null) {
      console.error("common.js: no open_setting exists");
    } else {
      this.open_setting.onclick = () => {
        this.display_modal("setting");
      };
    }
  }

  set_language() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });
  }

  display_modal(type, clickable_ovarlay = true) {
    this.overlay.classList.remove("hidden");

    document.querySelectorAll(`.modal`).forEach((m) => {
      m.classList.add("hidden");
    });

    const modal = document.getElementById(`${type}_modal`);
    if (modal == null) {
      console.error("common.js: no modal exists");
      return;
    }
    modal.classList.remove("hidden");

    if (clickable_ovarlay) {
      this.overlay.onclick = () => {
        this.overlay.classList.add("hidden");
      };
    }
  }

  render_rule(rule) {
    if (rule == null) return;

    const container = document.getElementById("rule_container");
    container.innerHTML = "";
    for (const state of rule) {
      const el = document.createElement(state.type);
      el.innerHTML = state.text;
      container.appendChild(el);
    }
  }
}
