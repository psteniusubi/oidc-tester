import { parsed } from "../../../../../assets/common/modules/document-promises.js";
import { hide_all_sections, toggle_section, show_section, hide_section, get_form_value, create_form_input, remove_empty_values, random_text, redirect_uri_pattern, redirect_uri_title } from "./helpers.js";
import { http_get, http_post } from "../../../../../assets/common/modules/fetch.js";
import { Events } from "./Events.js";

export class AccessToken {
    constructor(configuration) {
        this.configuration = configuration;
    }
    get request() {
        const section = document.getElementById("token_request");
        return {
            section: section,
            form: section.querySelector("form"),
            toggle: (value) => toggle_section("token_request", value)
        };
    }
    get response() {
        const section = document.getElementById("token_response");
        return {
            section: section,
            form: section.querySelector("form"),
            toggle: (value) => toggle_section("token_response", value),
        };

    }
    async init_request() {
        const issuer = await this.configuration.get_issuer_metadata(this.configuration.get_active_issuer());
        const client = await this.configuration.get_client_metadata(issuer.issuer, this.configuration.get_active_client());
        const form = this.request.form;
        Array.from(form.elements).forEach(t => t.value = "");
        form.elements["token_endpoint"].value = issuer["token_endpoint"] || "";
        form.elements["grant_type"].value = "authorization_code";
        const code = get_form_value("authorization_response", "code");
        form.elements["code"].value = code || "";
        form.elements["code_verifier"].value = localStorage.getItem("code_verifier") || "";
        form.elements["redirect_uri"].value = location.origin + location.pathname;
        form.elements["redirect_uri"].setAttribute("required", "required");
        form.elements["redirect_uri"].setAttribute("pattern", redirect_uri_pattern(client));
        form.elements["redirect_uri"].setAttribute("title", redirect_uri_title(client));
        form.elements["client_id"].value = client["client_id"] || "";
        form.elements["client_secret"].value = client["client_secret"] || "";
        return code !== null;
    }
    async init_response(json, event) {
        const form = this.response.form;
        form.innerHTML = "";
        for (const k of Object.keys(json)) {
            form.appendChild(create_form_input(k, json[k]));
        }
        if (("id_token" in json) || ("access_token" in json)) {
            if (event === true) {
                Events.dispatch_token();
            }
            return true;
        } else if (("error" in json)) {
            if (event === true) {
                Events.dispatch_token_error();
            }
            return true;
        } else {
            if (event === true) {
                Events.dispatch_token_reset();
            }
            return false;
        }
    }
    async submit() {
        const form = this.request.form;
        const endpoint = form.elements["token_endpoint"].value;
        const request = new URLSearchParams(new FormData(form));
        remove_empty_values(request);
        request.delete("token_endpoint");
        const json = await http_post(endpoint, request);
        if (await this.init_response(json, true)) {
            localStorage.removeItem("code_verifier");
        }
    }
    async bind() {
        await parsed;
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
            Events.dispatch_token_reset();
        });
        document.body.addEventListener(Events.CODE, async e => {
            await this.init_request();
            await this.init_response({});
            this.request.toggle(true);
            this.response.toggle(false);
            Events.dispatch_token_reset();
        });
        document.body.addEventListener(Events.CODE_RESET, async e => {
            await this.init_request();
            await this.init_response({});
            this.request.toggle(false);
            this.response.toggle(false);
            Events.dispatch_token_reset();
        });
        document.body.addEventListener(Events.TOKEN, async e => {
            this.request.toggle(false);
            this.response.toggle(true);
        });
        document.body.addEventListener(Events.TOKEN_ERROR, async e => {
            this.request.toggle(false);
            this.response.toggle(true);
            Events.dispatch_token_reset();
        });
    }
}
