import { ModalDialog } from "../../../../../assets/common/modules/ModalDialog.js";
import { http_get } from "../../../../../assets/common/modules/fetch.js";

export class NewProvider extends ModalDialog {
    constructor(id) {
        super(id);
    }
    fields() {
        return [
            "issuer",
            "authorization_endpoint",
            "token_endpoint",
            "userinfo_endpoint",
            "introspection_endpoint",
        ];
    }
    async create_popup(section) {
        await super.create_popup(section);
        const form = section.querySelector("form");
        form.elements["fetch"].addEventListener("click", async e => {
            const url = new URL(form.elements["issuer"].value);
            url.pathname = url.pathname + "/.well-known/openid-configuration";
            let json = {};
            try {
                json = await http_get(url);
            } catch {
                // TODO: show error
            }
            this.set_metadata(JSON.stringify(json, null, 2));
            this.json_to_form(json);
        });
        if ("readText" in navigator.clipboard) {
            form.elements["paste"].addEventListener("click", async e => {
                if ("readText" in navigator.clipboard) {
                    const text = await navigator.clipboard.readText();
                    if (text !== "") {
                        this.set_metadata(text, true);
                    }
                }
            });
        } else {
            const e = form.elements["paste"];
            e.parentNode.removeChild(e);
        }
        form.elements["clear"].addEventListener("click", async e => {
            this.set_metadata("{}", true);
            form.elements["metadata"].focus();
            form.elements["metadata"].select();
        });
        form.addEventListener("input", e => {
            if (e.target instanceof HTMLInputElement) {
                if (this.fields().includes(e.target.name)) {
                    const json = this.form_to_json();
                    this.set_metadata(JSON.stringify(json, null, 2));
                    return;
                }
            }
            if (e.target instanceof HTMLTextAreaElement) {
                let json = {};
                try {
                    json = JSON.parse(e.target.value);
                } catch {
                }
                this.json_to_form(json);
            }
        });
        const json = this.form_to_json();
        this.set_metadata(JSON.stringify(json, null, 2));
        return section;
    }
    set_metadata(value, dispatch) {
        this.form.elements["metadata"].value = value;
        if (dispatch === true) {
            this.form.elements["metadata"].dispatchEvent(new CustomEvent("input", { bubbles: true }));
        }
    }
    get_metadata_json() {
        if (!this.isOpen()) return {};
        const value = this.form.elements["metadata"].value;
        if (value === null || /^\s*$/.test(value)) return {};
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }
    form_to_json() {
        const json = {};
        for (const i of this.fields()) {
            const value = this.form.elements[i].value;
            if (value === null || /^\s*$/.test(value)) continue;
            json[i] = value;
        }
        return json;
    }
    json_to_form(json) {
        for (const i of this.fields()) {
            let value = "";
            if (i in json) {
                value = json[i];
            }
            this.form.elements[i].value = value;
        }
    }
}
