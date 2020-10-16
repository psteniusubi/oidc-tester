import { parsed } from "../../../../../assets/common/modules/document-promises.js";
import { hide_all_sections, toggle_section, show_section, hide_section, get_form_value, is_form_valid, create_form_input } from "./helpers.js";
import { http_get, http_post } from "../../../../../assets/common/modules/fetch.js";
import { decode_jwt } from "../../../common/modules/jwt.js";
import { Events } from "./Events.js";

export class IdToken {
    constructor(configuration) {
        this.configuration = configuration;
    }
    get request() {
        const section = document.getElementById("id_token");
        return {
            section: section,
            form: section.querySelector("form"),
            toggle: (value) => toggle_section("id_token", value),
        };
    }
    get response() {
        const section = document.getElementById("id_token_decoded");
        return {
            section: section,
            form: section.querySelector("form"),
            toggle: (value) => toggle_section("id_token_decoded", value),
        };
    }
    async init_request() {
        const issuer = await this.configuration.get_issuer_metadata(this.configuration.get_active_issuer());
        const form = this.request.form;
        const id_token = get_form_value("token_response", "id_token");
        form.elements["jwks_uri"].value = issuer["jwks_uri"] || "";
        form.elements["id_token"].value = id_token;
        return ("jwks_uri" in issuer) && (id_token !== null);
    }
    async init_response(header, body) {
        const form = this.response.form;
        form.innerHTML = "";
        for (const k of Object.keys(header)) {
            form.appendChild(create_form_input(k, header[k]));
        }
        for (const k of Object.keys(body)) {
            form.appendChild(create_form_input(k, body[k]));
        }
        return true;
    }
    async submit() {
        const form = this.request.form;
        const request = new URLSearchParams(new FormData(form));
        try {
            const jwks = await http_get(request.get("jwks_uri"));
            const jwt = await decode_jwt(request.get("id_token"), jwks);
            await this.init_response(jwt.header, jwt.body);
        } catch (e) {
            await this.init_response({ error: e }, {});
        }
        this.request.toggle(false);
        this.response.toggle(true);
    }
    async bind() {
        const form = this.request.form;
        form.addEventListener("submit", e => {
            e.preventDefault();
            this.submit();
        });
        form.addEventListener("reset", async e => {
            e.preventDefault();
            await this.init_request();
            await this.init_response({}, {});
            this.request.toggle(true);
            this.response.toggle(false);
        });
        document.body.addEventListener(Events.TOKEN, async e => {
            await this.init_request();
            await this.init_response({}, {});
            this.request.toggle(is_form_valid("id_token"));
            this.response.toggle(false);
        });
        document.body.addEventListener(Events.TOKEN_RESET, async e => {
            await this.init_request();
            await this.init_response({}, {});
            this.request.toggle(false);
            this.response.toggle(false);
        });
    }
}
