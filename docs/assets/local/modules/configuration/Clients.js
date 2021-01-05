import { NewClient } from "./NewClient.js";

export class Clients {
    constructor(config, id, providers) {
        this.config = config;
        this.id = id;
        this.providers = providers;
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
    set selected(client) {
        this.table.querySelectorAll("tr[data-index]")
            .forEach(i => i.classList.toggle("selected", client === i.getAttribute("data-index")));
    }
    get issuer() {
        return this.providers.selected;
    }
    onclick(listener) {
        this.table.addEventListener("client-click", listener);
    }
    dispatch_click(client) {
        this.table.dispatchEvent(new CustomEvent("client-click", { detail: client }));
    }
    click(e) {
        const tr = e.target.closest("tr[data-index]");
        if (tr == null) return;
        this.dispatch_click(tr.getAttribute("data-index"));
    }
    create_tr(client) {
        const tr = document.createElement("tr");

        tr.setAttribute("data-index", client.index);
        tr.classList.toggle("active", client.active === true);

        let td = document.createElement("td");
        td.innerText = "";
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerText = new Date(client.iat).toISOString();
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerText = client.uri;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerText = client.index;
        tr.appendChild(td);

        return tr;
    }
    build_table() {
        const tr_list = document.createDocumentFragment();
        for (const i of this.config.get_client_list(this.issuer)) {
            const tr = this.create_tr(i);
            tr_list.appendChild(tr);
        }
        const tbody = this.table.querySelector("tbody");
        tbody.innerHTML = "";
        tbody.appendChild(tr_list);
    }
    update_active() {
        const client = this.config.get_active_client();
        this.table.querySelectorAll("tr.active").forEach(t => t.classList.remove("active"));
        if (client !== null) {
            this.table.querySelectorAll(`tr[data-index="${client}"]`).forEach(t => t.classList.add("active"));
        }
        this.providers.update_active();
    }
    build() {
        this.table.addEventListener("click", e => this.click(e));
        this.build_table();
        this.providers.onclick(e => {
            this.build_table();
            this.update_active();
        });
        this.form.elements["add"].addEventListener("click", e => {
            e.preventDefault();
            if (this.issuer === null) return;
            const client = new NewClient("client-dialog", this.issuer);
            client.onsubmit(e => {
                const json = e.detail.dialog.get_metadata_json();
                this.config.add_client_metadata(this.issuer, json);
                this.build_table();
                this.selected = json.client_id;
                this.update_active();
                this.dispatch_click(json.client_id);
                e.detail.close();
            })
            client.open();
        });
        this.form.elements["edit"].addEventListener("click", async e => {
            e.preventDefault();
            if (this.issuer === null) return;
            const selected = this.selected;
            const metadata = await this.config.get_client_metadata(this.issuer, selected);
            if (!("client_id" in metadata)) return;
            const client = new NewClient("client-dialog", this.issuer);
            client.onsubmit(e => {
                const json = e.detail.dialog.get_metadata_json();
                this.config.update_client_metadata(this.issuer, selected, json);
                this.build_table();
                this.selected = json.client_id;
                this.update_active();
                this.dispatch_click(json.client_id);
                e.detail.close();
            })
            await client.open();
            client.set_metadata(JSON.stringify(metadata, null, 2), true);
        });
        this.form.elements["active"].addEventListener("click", e => {
            e.preventDefault();
            this.config.set_active(this.issuer, this.selected);
            this.update_active();
        });
        this.form.elements["login"].addEventListener("click", e => {
            e.preventDefault();
            if (this.issuer === null) return;
            const client = this.selected;
            if (client === null) return;
            const initiate_login = new URLSearchParams();
            initiate_login.set("iss", this.issuer);
            initiate_login.set("client_id", client);
            const url = new URL("authorization-code-flow.html", location.href);
            url.hash = "#" + initiate_login;
            location.assign(url);
        });
        this.form.elements["remove"].addEventListener("click", e => {
            e.preventDefault();
            if (this.issuer === null) return;
            const client = this.selected;
            if (client === null) return;
            this.config.remove_client(this.issuer, client);
            this.build_table();
            this.selected = "";
            this.update_active();
            this.dispatch_click("");
        });
    }
}
