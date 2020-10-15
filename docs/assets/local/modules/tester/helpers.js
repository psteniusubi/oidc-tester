import { btoaUrlSafe } from "../../../common/modules/base64url.js";

function hide_all_sections() {
    document.querySelectorAll("section.collapsed > input[type='checkbox']:not(:checked)")
        .forEach(t => t.checked = true);
}
function toggle_section(id, value) {
    const checkbox = document.getElementById(id).querySelector("section > input[type='checkbox']");
    checkbox.checked = value;
}
const show_section = id => toggle_section(id, false);
const hide_section = id => toggle_section(id, true);
function focus_submit(form) {
    form.querySelector("button[type='submit']").scrollIntoView();
    form.querySelector("button[type='submit']").focus();
}

function get_form_value(id, name) {
    const form = document.getElementById(id).querySelector("form");
    if (form == null) {
        return null;
    }
    const element = form.elements[name];
    if (element == null) {
        return null;
    }
    return element.value;
}

function create_form_input(name, value) {
    const label = document.createElement("label");
    const span = document.createElement("span");
    span.innerText = name;
    label.appendChild(span);
    const input = document.createElement("input");
    input.type = "text";
    input.name = name;
    input.placeholder = name;
    input.classList.add("flex1");
    input.value = value;
    label.appendChild(input);
    return label;
}

function remove_empty_values(search) {
    if (!(search instanceof URLSearchParams)) throw "invalid argument";
    const keys = Array.from(search.keys());
    for (const key of keys) {
        if (/^\s*$/.test(search.get(key))) {
            search.delete(key);
        }
    }
}

function random_text() {
    return btoaUrlSafe(Array.from(window.crypto.getRandomValues(new Uint8Array(24)), t => String.fromCharCode(t)).join(""));
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function redirect_uri_pattern(client) {
    if (client === null || !("redirect_uris" in client)) return "";
    const pattern = client.redirect_uris
        .map(t => `(${escapeRegExp(t)})`)
        .join("|");
    return `^${pattern}$`;
}

function redirect_uri_title(client) {
    if (client === null || !("redirect_uris" in client)) return "";
    return JSON.stringify({ redirect_uris: client.redirect_uris }, null, 2);
}

export { hide_all_sections, show_section, hide_section, get_form_value, create_form_input, remove_empty_values, random_text, redirect_uri_pattern, redirect_uri_title };
