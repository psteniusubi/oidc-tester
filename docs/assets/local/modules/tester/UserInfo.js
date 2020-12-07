import { parsed } from "../../../../../assets/common/modules/document-promises.js";
import { hide_all_sections, toggle_section, show_section, hide_section, get_form_value, is_form_valid, create_form_input, remove_empty_values, format_http_error } from "./helpers.js";
import { http, http_get, http_post } from "../../../../../assets/common/modules/fetch.js";
import { Events } from "./Events.js";

export class UserInfo {
    constructor(configuration) {
        this.configuration = configuration;
    }
    get request() {
        const section = document.getElementById("userinfo_request");
        return {
            section: section,
            form: section.querySelector("form"),
            toggle: (value) => toggle_section("userinfo_request", value),
        };
    }
    get response() {
        const section = document.getElementById("userinfo_response");
        return {
            section: section,
            form: section.querySelector("form"),
            toggle: (value) => toggle_section("userinfo_response", value),
        };
    }
    async init_request() {
        const issuer = await this.configuration.get_issuer_metadata(this.configuration.get_active_issuer());
        const client = await this.configuration.get_client_metadata(issuer.issuer, this.configuration.get_active_client());
        const form = this.request.form;
        const access_token = get_form_value("token_response", "access_token");
        form.elements["userinfo_endpoint"].value = issuer["userinfo_endpoint"] || "";
        form.elements["access_token"].value = access_token || "";
        return ("userinfo_endpoint" in issuer) && (access_token !== null);
    }
    async init_response(json) {
        const form = this.response.form;
        form.innerHTML = "";
        for (const k of Object.keys(json)) {
            form.appendChild(create_form_input(k, json[k]));
        }
        return true;
    }
    async submit(name) {
        const form = this.request.form;
        const endpoint = form.elements["userinfo_endpoint"].value;
        const request = new URLSearchParams(new FormData(form));
        remove_empty_values(request);
        request.delete("userinfo_endpoint");
        if (name === "post") {
            let json = {};
            try {
                json = await http_post(endpoint, request);
            } catch (e) {
                json = await format_http_error(e);
            }
            await this.init_response(json);
        } else {
            const token = form.elements["access_token"].value;
            const request = new Request(endpoint, {
                method: "GET",
                headers: { "Authorization": "Bearer " + token }
            });
            let json = {};
            try {
                json = await http.invoke_json(request);
            } catch (e) {
                json = await format_http_error(e);
            }
            await this.init_response(json);
        }
        hide_section("token_response");
        this.request.toggle(false);
        this.response.toggle(true);
    }
    async bind() {
        const form = this.request.form;
        form.addEventListener("submit", e => {
            e.preventDefault();
            this.submit(e.submitter.name);
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
            this.request.toggle(is_form_valid("userinfo_request"));
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
