import { parsed } from "../../../../../assets/common/modules/document-promises.js";
import { hide_all_sections, show_section, hide_section, get_form_value, create_form_input, remove_empty_values } from "./helpers.js";
import { http_get, http_post } from "../../../../../assets/common/modules/fetch.js";

async function build_userinfo_request(configuration) {
    const issuer = await configuration.get_issuer_metadata(configuration.get_active_issuer());
    const client = await configuration.get_client_metadata(issuer.issuer, configuration.get_active_client());
    const form = document.getElementById("userinfo_request").querySelector("form");
    function reset() {
        const access_token = get_form_value("token_response", "access_token");
        form.elements["userinfo_endpoint"].value = issuer["userinfo_endpoint"] || "";
        form.elements["access_token"].value = access_token || "";
        return ("userinfo_endpoint" in issuer) && (access_token !== null);
    }
    form.addEventListener("submit", async e => {
        e.preventDefault();
        if (e.submitter.name === "post") {
            const endpoint = new URL(form.elements["userinfo_endpoint"].value);
            const request = new URLSearchParams(new FormData(form));
            remove_empty_values(request);
            request.delete("userinfo_endpoint");
            const json = await http_post(endpoint, request);
            hide_all_sections();
            show_section("userinfo_request");
            if (await build_userinfo_response(json)) {
                show_section("userinfo_response");
            }
        } else {
            const endpoint = new URL(form.elements["userinfo_endpoint"].value);
            const token = form.elements["access_token"].value;
            const request = new Request(endpoint, {
                method: "GET",
                headers: { "Authorization": "Bearer " + token }
            });
            const response = await fetch(request);
            const json = await response.json();
            hide_all_sections();
            show_section("userinfo_request");
            if (await build_userinfo_response(json)) {
                show_section("userinfo_response");
            }
        }
    });
    form.addEventListener("reset", e => {
        e.preventDefault();
        reset();
        build_userinfo_response({});
    });
    return reset();
}

async function build_userinfo_response(json) {
    const form = document.getElementById("userinfo_response").querySelector("form");
    form.innerHTML = "";
    for (const k of Object.keys(json)) {
        form.appendChild(create_form_input(k, json[k]));
    }
    return true;
}

export { build_userinfo_request, build_userinfo_response };
