import { parsed } from "../../../../../assets/common/modules/document-promises.js";
import { hide_all_sections, toggle_section, show_section, hide_section, get_form_value, is_form_valid, create_form_input, remove_empty_values, format_http_error } from "./helpers.js";
import { http_get, http_post } from "../../../../../assets/common/modules/fetch.js";
import { Events } from "./Events.js";

export class Introspection {
    constructor(configuration) {
        this.configuration = configuration;
    }
    get request() {
        const section = document.getElementById("introspection_request");
        return {
            section: section,
            form: section.querySelector("form"),
            toggle: (value) => toggle_section("introspection_request", value),
        };
    }
    get response() {
        const section = document.getElementById("introspection_response");
        return {
            section: section,
            form: section.querySelector("form"),
            toggle: (value) => toggle_section("introspection_response", value),
        };
    }
    async init_request() {
        const issuer = await this.configuration.get_issuer_metadata(this.configuration.get_active_issuer());
        const client = await this.configuration.get_client_metadata(issuer.issuer, this.configuration.get_active_client());
        const form = this.request.form;
        const access_token = get_form_value("token_response", "access_token");
        form.elements["introspection_endpoint"].value = issuer["introspection_endpoint"] || "";
        form.elements["token"].value = access_token || "";
        form.elements["client_id"].value = client["client_id"] || "";
        form.elements["client_secret"].value = client["client_secret"] || "";
        return ("introspection_endpoint" in issuer) && (access_token !== null);
    }
    async init_response(json) {
        const form = this.response.form;
        form.innerHTML = "";
        for (const k of Object.keys(json)) {
            form.appendChild(create_form_input(k, json[k]));
        }
        return true;
    }
    async submit() {
        const form = this.request.form;
        const endpoint = form.elements["introspection_endpoint"].value;
        const request = new URLSearchParams(new FormData(form));
        remove_empty_values(request);
        request.delete("introspection_endpoint");
        let json = {};
        try {
            json = await http_post(endpoint, request);
        } catch (e) {
            json = await format_http_error(e);
        }
        await this.init_response(json);
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
            await this.init_response({});
            this.request.toggle(true);
            this.response.toggle(false);
        });
        document.body.addEventListener(Events.TOKEN, async e => {
            await this.init_request();
            await this.init_response({}, {});
            this.request.toggle(is_form_valid("introspection_request"));
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
