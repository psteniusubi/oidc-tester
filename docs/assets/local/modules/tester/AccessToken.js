import { parsed } from "../../../../../assets/common/modules/document-promises.js";
import { hide_all_sections, show_section, hide_section, get_form_value, create_form_input, remove_empty_values, random_text, redirect_uri_pattern, redirect_uri_title } from "./helpers.js";
import { http_get, http_post } from "../../../../../assets/common/modules/fetch.js";
import { build_id_token, build_id_token_decoded } from "./IdToken.js";
import { build_introspection_request, build_introspection_response } from "./Introspection.js";
import { build_userinfo_request, build_userinfo_response } from "./UserInfo.js";

async function build_token_request(configuration) {
    const issuer = await configuration.get_issuer_metadata(configuration.get_active_issuer());
    const client = await configuration.get_client_metadata(issuer.issuer, configuration.get_active_client());
    await parsed;
    const form = document.getElementById("token_request").querySelector("form");
    function reset() {
        Array.from(form.elements).forEach(t => t.value = "");
        const code = get_form_value("authorization_response", "code");
        form.elements["token_endpoint"].value = issuer["token_endpoint"] || "";
        form.elements["grant_type"].value = "authorization_code";
        form.elements["code"].value = code || "";
        form.elements["code_verifier"].value = localStorage.getItem("code_verifier") || "";
        form.elements["redirect_uri"].value = location.origin + location.pathname;
        form.elements["redirect_uri"].setAttribute("required", "required");
        form.elements["redirect_uri"].setAttribute("pattern", redirect_uri_pattern(client));
        form.elements["redirect_uri"].setAttribute("title", redirect_uri_title(client));
        form.elements["client_id"].value = client["client_id"] || "";
        form.elements["client_secret"].value = client["client_secret"] || "";
        return code != null;
    }
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const endpoint = form.elements["token_endpoint"].value;
        const request = new URLSearchParams(new FormData(form));
        remove_empty_values(request);
        request.delete("token_endpoint");
        const json = await http_post(endpoint, request);
        hide_all_sections();
        show_section("token_response");
        if (await build_token_response(json)) {
            localStorage.removeItem("code_verifier");
            let section = null;
            if (await build_id_token(configuration)) section = section || "id_token";
            if (await build_introspection_request(configuration)) section = section || "introspection_request";
            if (await build_userinfo_request(configuration)) section = section || "userinfo_request";
            show_section(section);
        }
    });
    form.addEventListener("reset", e => {
        e.preventDefault();
        reset();
        build_token_response({});
    });
    return reset();
}

async function build_token_response(json) {
    const form = document.getElementById("token_response").querySelector("form");
    form.innerHTML = "";
    for (const k of Object.keys(json)) {
        form.appendChild(create_form_input(k, json[k]));
    }
    return ("id_token" in json) || ("access_token" in json);
}

export { build_token_request, build_token_response };
