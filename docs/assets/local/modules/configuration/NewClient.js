import { ModalDialog } from "../../../../../assets/common/modules/ModalDialog.js";
import { http_get } from "../../../../../assets/common/modules/fetch.js";

export class NewClient extends ModalDialog {
    constructor(id) {
        super(id);
    }
    fields() {
        return [
            "client_id",
            "client_secret",
            "redirect_uris",
            "scope",
        ];
    }
    async create_popup(section) {
        await super.create_popup(section);
        const form = section.querySelector("form");
        form.elements["copy"].addEventListener("click", async e => {
            await navigator.clipboard.writeText(form.elements["metadata"].value);
        });
        form.elements["paste"].addEventListener("click", async e => {
            const text = await navigator.clipboard.readText();
            if (text !== "") {
                this.set_metadata(text, true);
            }
        });
        form.elements["clear"].addEventListener("click", async e => {
            this.set_metadata("{}", true);
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
        const redirect_uris = [
            new URL("authorization-code-flow.html", location.href),
            new URL("spa.html", location.href),
        ];
        form.elements["redirect_uris"].value = redirect_uris.join(" ");
        form.elements["scope"].value = "openid";
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
            if ("redirect_uris" === i) {
                json[i] = value.split(" ");
            } else {
                json[i] = value;
            }
        }
        return json;
    }
    json_to_form(json) {
        for (const i of this.fields()) {
            let value = "";
            if (i in json) {
                const t = json[i];
                if (Array.isArray(t)) {
                    value = t.join(" ");
                } else {
                    value = t;
                }
            }
            this.form.elements[i].value = value;
        }
    }
}
