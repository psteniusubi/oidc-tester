import { NewProvider } from "./NewProvider.js";

export class Providers {
    constructor(config, id) {
        this.config = config;
        this.id = id;
    }
    get section() {
        return document.getElementById(this.id);
    }
    get table() {
        return this.section.querySelector("table");
    }
    get form() {
        return this.section.querySelector("form");
    }
    get selected() {
        const tr = this.table.querySelector("tr[data-index].selected");
        return (tr !== null)
            ? tr.getAttribute("data-index")
            : null;
    }
    set selected(issuer) {
        this.table.querySelectorAll("tr[data-index]")
            .forEach(i => i.classList.toggle("selected", issuer === i.getAttribute("data-index")));
    }
    onclick(listener) {
        this.table.addEventListener("idp-click", listener);
    }
    dispatch_click(issuer) {
        this.table.dispatchEvent(new CustomEvent("idp-click", { detail: issuer }));
    }
    click(e) {
        const tr = e.target.closest("tr[data-index]");
        if (tr == null) return;
        this.dispatch_click(tr.getAttribute("data-index"));
    }
    create_tr(issuer) {
        const tr = document.createElement("tr");

        tr.setAttribute("data-index", issuer.index);
        tr.classList.toggle("active", issuer.active === true);

        let td = document.createElement("td");
        td.innerText = "";
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerText = new Date(issuer.iat).toISOString();
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerText = issuer.index;
        tr.appendChild(td);

        return tr;
    }
    build_table() {
        const tr_list = document.createDocumentFragment();
        for (const i of this.config.get_issuer_list()) {
            const tr = this.create_tr(i);
            tr_list.appendChild(tr);
        }
        const tbody = this.table.querySelector("tbody");
        tbody.innerHTML = "";
        tbody.appendChild(tr_list);
    }
    update_active() {
        const issuer = this.config.get_active_issuer();
        this.table.querySelectorAll("tr.active").forEach(t => t.classList.remove("active"));
        if (issuer !== null) {
            this.table.querySelectorAll(`tr[data-index="${issuer}"]`).forEach(t => t.classList.add("active"));
        }
    }
    async add_provider_dialog(metadata) {
        const idp = new NewProvider("idp-dialog");
        idp.onsubmit(e => {
            const json = e.detail.dialog.get_metadata_json();
            this.config.add_issuer_metadata(json);
            this.build_table();
            this.selected = json.issuer;
            this.dispatch_click(json.issuer);
            e.detail.close();
        })
        await idp.open();
        if (metadata !== null && metadata !== undefined) {
            idp.set_metadata(JSON.stringify(metadata, null, 2), true);
        }
    }
    build() {
        this.table.addEventListener("click", e => this.click(e));
        this.build_table();
        this.form.elements["add"].addEventListener("click", e => {
            e.preventDefault();
            this.add_provider_dialog();
        });
        this.form.elements["edit"].addEventListener("click", async e => {
            e.preventDefault();
            const selected = this.selected;
            const metadata = await this.config.get_issuer_metadata(selected);
            if (!("issuer" in metadata)) return;
            const idp = new NewProvider("idp-dialog");
            idp.onsubmit(e => {
                const json = e.detail.dialog.get_metadata_json();
                this.config.update_issuer_metadata(selected, json);
                this.build_table();
                this.selected = json.issuer;
                this.dispatch_click(json.issuer);
                e.detail.close();
            })
            await idp.open();
            idp.set_metadata(JSON.stringify(metadata, null, 2), true);
        });
        this.form.elements["login"].addEventListener("click", e => {
            e.preventDefault();
            const issuer = this.selected;
            if (issuer === null) return;
            const initiate_login = new URLSearchParams();
            initiate_login.set("iss", issuer);
            const url = new URL("authorization-code-flow.html", location.href);
            url.hash = "#" + initiate_login;
            location.assign(url);
        });
        this.form.elements["remove"].addEventListener("click", e => {
            e.preventDefault();
            const issuer = this.selected;
            if (issuer === null) return;
            this.config.remove_issuer(issuer);
            this.build_table();
            this.selected = "";
            this.dispatch_click("");
        });
    }
}
