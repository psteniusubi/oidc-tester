import { parsed } from "../../../../../assets/common/modules/document-promises.js";
import { hide_all_sections, show_section, hide_section, get_form_value, create_form_input } from "./helpers.js";
import { http_get, http_post } from "../../../../../assets/common/modules/fetch.js";
import { decode_jwt } from "../../../common/modules/jwt.js";

async function build_id_token(configuration) {
    const issuer = await configuration.get_issuer_metadata(configuration.get_active_issuer());
    const client = await configuration.get_client_metadata(issuer.issuer, configuration.get_active_client());
    const form = document.getElementById("id_token").querySelector("form");
    function reset() {
        const id_token = get_form_value("token_response", "id_token");
        form.elements["jwks_uri"].value = issuer["jwks_uri"] || "";
        form.elements["id_token"].value = id_token;
        return ("jwks_uri" in issuer) && (id_token !== null);
    }
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const request = new URLSearchParams(new FormData(form));
        try {
            const jwks = await http_get(request.get("jwks_uri"));
            const t = await decode_id_token(request.get("id_token"), jwks);
            hide_all_sections();
            show_section("id_token");
            if (await build_id_token_decoded(t.header, t.body)) {
                show_section("id_token_decoded");
            }
        } catch {
            hide_all_sections();
            show_section("id_token");
            if (await build_id_token_decoded({}, {})) {
                show_section("id_token_decoded");
            }
        }
    });
    form.addEventListener("reset", e => {
        e.preventDefault();
        reset();
        build_id_token_decoded({}, {});
    });
    return reset();
}

async function decode_id_token(id_token, jwks) {
    const jwt = await decode_jwt(id_token, jwks);
    return jwt;
}

async function build_id_token_decoded(header, body) {
    const form = document.getElementById("id_token_decoded").querySelector("form");
    form.innerHTML = "";
    for (const k of Object.keys(header)) {
        form.appendChild(create_form_input(k, header[k]));
    }
    for (const k of Object.keys(body)) {
        form.appendChild(create_form_input(k, body[k]));
    }
    return true;
}

export { build_id_token, build_id_token_decoded };
