import { parsed } from "../../../../../assets/common/modules/document-promises.js";
import { hide_all_sections, show_section, hide_section, get_form_value, create_form_input, remove_empty_values } from "./helpers.js";
import { http_get, http_post } from "../../../../../assets/common/modules/fetch.js";

async function build_introspection_request(configuration) {
    const issuer = await configuration.get_issuer_metadata(configuration.get_active_issuer());
    const client = await configuration.get_client_metadata(issuer.issuer, configuration.get_active_client());
    const form = document.getElementById("introspection_request").querySelector("form");
    function reset() {
        const access_token = get_form_value("token_response", "access_token");
        form.elements["introspection_endpoint"].value = issuer["introspection_endpoint"] || "";
        form.elements["token"].value = access_token || "";
        form.elements["client_id"].value = client["client_id"] || "";
        form.elements["client_secret"].value = client["client_secret"] || "";
        return ("introspection_endpoint" in issuer) && (access_token !== null);
    }
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const endpoint = form.elements["introspection_endpoint"].value;
        const request = new URLSearchParams(new FormData(form));
        remove_empty_values(request);
        request.delete("introspection_endpoint");
        const json = await http_post(endpoint, request);
        hide_all_sections();
        show_section("introspection_request");
        if (await build_introspection_response(json)) {
            show_section("introspection_response");
        }
    });
    form.addEventListener("reset", e => {
        e.preventDefault();
        reset();
        build_introspection_response({});
    });
    return reset();
}

async function build_introspection_response(json) {
    const form = document.getElementById("introspection_response").querySelector("form");
    form.innerHTML = "";
    for (const k of Object.keys(json)) {
        form.appendChild(create_form_input(k, json[k]));
    }
    return true;
}

export { build_introspection_request, build_introspection_response };
