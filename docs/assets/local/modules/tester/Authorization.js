import { parsed } from "../../../../../assets/common/modules/document-promises.js";
import { hide_all_sections, toggle_section, show_section, hide_section, get_form_value, create_form_input, remove_empty_values, random_text, redirect_uri_pattern, redirect_uri_title } from "./helpers.js";
import { get_code_challenge_methods, new_code_verifier, get_code_challenge } from "../../../common/modules/pkce.js";
import { Events } from "./Events.js";

export class Authorization {
    constructor(configuration) {
        this.configuration = configuration;
    }
    get request() {
        const section = document.getElementById("authorization_request");
        return {
            section: section,
            form: section.querySelector("form"),
            toggle: (value) => toggle_section("authorization_request", value),
        };
    }
    get response() {
        const section = document.getElementById("authorization_response");
        return {
            section: section,
            form: section.querySelector("form"),
            toggle: (value) => toggle_section("authorization_response", value),
        };
    }
    async init_request() {
        const issuer = await this.configuration.get_issuer_metadata(this.configuration.get_active_issuer());
        const client = await this.configuration.get_client_metadata(issuer.issuer, this.configuration.get_active_client());
        const form = this.request.form;
        Array.from(form.elements).forEach(t => t.value = "");
        form.elements["authorization_endpoint"].value = issuer["authorization_endpoint"] || "";
        form.elements["response_type"].value = "code";
        form.elements["client_id"].value = client["client_id"] || "";
        form.elements["redirect_uri"].value = location.origin + location.pathname;
        form.elements["redirect_uri"].setAttribute("required", "required");
        form.elements["redirect_uri"].setAttribute("pattern", redirect_uri_pattern(client));
        form.elements["redirect_uri"].setAttribute("title", redirect_uri_title(client));
        form.elements["scope"].value = client.scope || "openid";
        if ("code_challenge_methods_supported" in issuer) {
            this.new_code_challenge("S256");
        }
        form.elements["state"].value = random_text();
        form.elements["nonce"].value = random_text();
        return true;
    }
    async init_response(search, event) {
        const form = this.response.form;
        form.innerHTML = "";
        const params = new URLSearchParams(search);
        if (params.has("code") || params.has("error")) {
            for (const [k, v] of params) {
                form.appendChild(create_form_input(k, v));
            }
            if (event === true) {
                if (params.has("code")) {
                    Events.dispatch_code();
                } else {
                    Events.dispatch_code_error();
                }
            }
            return true;
        } else {
            if (event === true) {
                Events.dispatch_code_reset();
            }
            return false;
        }
    }
    async new_code_challenge(method) {
        const form = this.request.form;
        form.elements["code_challenge_method"].value = method;
        const code_verifier = await new_code_verifier(method);
        if (code_verifier !== null) {
            form.elements["code_challenge"].setAttribute("data-code-verifier", code_verifier);
            const code_challenge = await get_code_challenge(method, code_verifier);
            form.elements["code_challenge"].value = code_challenge;
        } else {
            form.elements["code_challenge"].removeAttribute("data-code-verifier");
            form.elements["code_challenge"].value = "";
        }
    }
    async submit() {
        const form = this.request.form;
        const endpoint = new URL(form.elements["authorization_endpoint"].value);
        const search = new URLSearchParams(endpoint.search);
        const request = new URLSearchParams(new FormData(form));
        request.delete("authorization_endpoint");
        remove_empty_values(request);
        for (const [k, v] of request) {
            search.append(k, v);
        }
        endpoint.search = search;
        if (form.elements["code_challenge"].hasAttribute("data-code-verifier")) {
            const code_verifier = form.elements["code_challenge"].getAttribute("data-code-verifier");
            localStorage.setItem("code_verifier", code_verifier);
        } else {
            localStorage.removeItem("code_verifier");
        }
        location.assign(endpoint);
    }
    async bind() {
        await parsed;
        const form = this.request.form;
        form.elements["code_challenge_method"].addEventListener("input", e => {
            e.preventDefault();
            this.new_code_challenge(e.target.value);
        });
        form.addEventListener("submit", e => {
            e.preventDefault();
            this.submit();
        });
        form.addEventListener("reset", async e => {
            e.preventDefault();
            await this.init_request();
            await this.init_response("");
            this.request.toggle(true);
            this.response.toggle(false);
            Events.dispatch_code_reset();
        });
        document.body.addEventListener(Events.CODE, async e => {
            this.request.toggle(false);
            this.response.toggle(true);
        });
        document.body.addEventListener(Events.CODE_ERROR, async e => {
            this.request.toggle(false);
            this.response.toggle(true);
            Events.dispatch_code_reset();
        });
        document.body.addEventListener(Events.TOKEN, async e => {
            this.request.toggle(false);
            this.response.toggle(false);
        });
    }
}
