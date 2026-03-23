import { t, set_lang } from "../i18n/i18n.js";

export class Common {
  constructor() {
    this.overlay = document.getElementById("overlay");
    if (this.overlay != null) {
      this.overlay.addEventListener("click", (event) => {
        if (!this.clickable_overlay) return;
        if (event.target !== event.currentTarget) return;

        this.overlay.classList.add("hidden");
      });
    }

    const lang = localStorage.getItem("lang");
    if (lang) {
      set_lang(lang);
    }

    this.set_language();
    this.open_setting = document.getElementById("open_setting");
    if (this.open_setting == null) {
      console.error("common.js: no open_setting exists");
    } else {
      this.open_setting.onclick = () => {
        this.display_modal("setting");
      };
      this.render_setting();
    }
  }

  set_language() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });

    if (document.querySelector("[data-rule]")) {
      const key = el.dataset.rule;
      this.render_rule(t(key), key);
    }
  }

  set_i18n(el, key) {
    el.dataset.i18n = key;
    el.textContent = t(key);
    return el;
  }

  display_modal(type, clickable_overlay = true) {
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

    this.clickable_overlay = clickable_overlay;
  }

  render_setting() {
    const container = document.getElementById("setting_container");
    if (container == null) {
      console.error("common.js: no setting_container exists");
      return;
    }
    {
      const div = document.createElement("div");
      div.id = "language_setting_container";
      const select = document.createElement("select");
      {
        const option = document.createElement("option");
        option.value = "en";
        option.innerText = "English";
        if (localStorage.getItem("lang") == "en") option.selected = true;
        select.appendChild(option);
      }
      {
        const option = document.createElement("option");
        option.value = "ja";
        option.innerText = "日本語";
        if (localStorage.getItem("lang") == "ja") option.selected = true;
        select.appendChild(option);
      }
      select.addEventListener("change", (event) => {
        set_lang(event.currentTarget.value);
        localStorage.setItem("lang", event.currentTarget.value);
        this.set_language();
      });
      div.appendChild(select);
      container.appendChild(div);
    }
  }

  render_rule(rule, path) {
    if (rule == null) return;

    const container = document.getElementById("rule_container");
    container.dataset.rule = container.dataset.rule
      ? container.dataset.rule
      : path;

    container.innerHTML = "";
    for (const state of rule) {
      const el = document.createElement(state.type);
      el.innerHTML = state.text;
      container.appendChild(el);
    }
  }
}
