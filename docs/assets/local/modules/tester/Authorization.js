import { parsed } from "../../../../../assets/common/modules/document-promises.js";
import { hide_all_sections, show_section, hide_section, get_form_value, create_form_input, remove_empty_values, random_text, redirect_uri_pattern, redirect_uri_title } from "./helpers.js";
import { get_code_challenge_methods, new_code_verifier, get_code_challenge } from "../../../common/modules/pkce.js";

async function build_authorization_request(configuration) {
    const issuer = await configuration.get_issuer_metadata(configuration.get_active_issuer());
    const client = await configuration.get_client_metadata(issuer.issuer, configuration.get_active_client());
    await parsed;
    const form = document.getElementById("authorization_request").querySelector("form");
    function reset() {
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
            form.elements["code_challenge_method"].value = "S256";
            form.elements["code_challenge_method"].dispatchEvent(new CustomEvent("input"));
        }
        form.elements["state"].value = random_text();
        form.elements["nonce"].value = random_text();
    }
    form.elements["code_challenge_method"].addEventListener("input", async e => {
        const code_verifier = await new_code_verifier(e.target.value);
        form.elements["code_challenge"].setAttribute("data-code-verifier", code_verifier);
        const code_challenge = await get_code_challenge(e.target.value, code_verifier);
        form.elements["code_challenge"].value = code_challenge;
    });
    form.addEventListener("submit", e => {
        e.preventDefault();
        const endpoint = new URL(form.elements["authorization_endpoint"].value);
        const search = new URLSearchParams(endpoint.search);
        const request = new URLSearchParams(new FormData(e.target));
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
    });
    form.addEventListener("reset", e => {
        e.preventDefault();
        reset();
        build_authorization_response();
    });
    reset();
    return true;
}

async function build_authorization_response() {
    await parsed;
    const form = document.getElementById("authorization_response").querySelector("form");
    form.innerHTML = "";
    const params = new URLSearchParams(location.search);
    if (!params.has("code") && !params.has("error")) {
        return false;
    }
    history.replaceState(null, null, location.pathname);
    for (const [k, v] of params) {
        form.appendChild(create_form_input(k, v));
    }
    return true;
}

export { build_authorization_request, build_authorization_response };
