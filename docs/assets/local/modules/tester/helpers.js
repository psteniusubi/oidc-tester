import { btoaUrlSafe } from "../../../common/modules/base64url.js";

const isNull = (value) => (value === null) || (value === undefined);

function hide_all_sections() {
    document.querySelectorAll("section.collapsed > input[type='checkbox']:not(:checked)")
        .forEach(t => t.checked = true);
}
function toggle_section(id, value) {
    const checkbox = document.getElementById(id).querySelector("section > input[type='checkbox']");
    // checkbox checked = false - visible
    // checkbox checked = true - hidden
    checkbox.checked = !(value === true);
}
const show_section = id => toggle_section(id, true);
const hide_section = id => toggle_section(id, false);
function focus_submit(form) {
    form.querySelector("button[type='submit']").scrollIntoView();
    form.querySelector("button[type='submit']").focus();
}

function get_form_value(id, name) {
    const form = document.getElementById(id).querySelector("form");
    if (isNull(form)) {
        return null;
    }
    const element = form.elements[name];
    if (isNull(element)) {
        return null;
    }
    return element.value;
}

function is_form_valid(id) {
    const form = document.getElementById(id).querySelector("form");
    if (isNull(form)) {
        return false;
    }
    return (form.querySelector("input") !== null)
        && (form.querySelector("input:invalid") === null);
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
    if (isNull(client) || !("redirect_uris" in client)) return "";
    const pattern = client.redirect_uris
        .map(t => `(${escapeRegExp(t)})`)
        .join("|");
    return `^${pattern}$`;
}

function redirect_uri_title(client) {
    if (isNull(client) || !("redirect_uris" in client)) return "";
    return JSON.stringify({ redirect_uris: client.redirect_uris }, null, 2);
}

async function format_http_error(e) {
    let json = {};
    if ("http_error" === e.error) {
        try {
            json = await e.http_response.json();
        } catch {
            json = {};
        }
        json["http_error"] = e.http_status;
    } else if ("fetch_error" === e.error) {
        json["fetch_error"] = e.fetch_error.toString();
    } else {
        json["error"] = e.toString();
    }
    if ("http_request" in e) {
        json["http_request"] = `${e.http_request.method} ${e.http_request.url}`;
    }
    return json;
}

export {
    hide_all_sections, toggle_section, show_section, hide_section,
    get_form_value, is_form_valid,
    create_form_input,
    remove_empty_values,
    random_text,
    redirect_uri_pattern, redirect_uri_title,
    format_http_error
};
