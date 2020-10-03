class MyIssuer extends HTMLElement {
    constructor() {
        super();
        this._id = Math.random() * 0xffffffff;
    }
    set value(value) {
        this._value = value;
    }
    get value() {
        return this._value;
    }
    createCheckBox(id) {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = "my-issuer";
        input.id = id;
        return input;
    }
    createLabel(id, text) {
        const label = document.createElement("label");
        label.htmlFor = id;
        label.innerText = text;
        return label;
    }
    createButton(value, name) {
        const input = document.createElement("button");
        input.innerText = value;
        input.addEventListener("click", () => this.dispatchEvent(new CustomEvent(name || "my-click")));
        return input;
    }
    connectedCallback() {
        const id = `_${this._id}`;

        const input = this.createCheckBox(id);
        this.appendChild(input);

        const issuer = document.createElement("div");
        issuer.className = "issuer";
        issuer.appendChild(this.createLabel(id, this.value));
        const add_client = this.createButton("Add Client", "my-add-client");
        add_client.addEventListener("click", () => input.checked = true)
        issuer.appendChild(add_client);
        issuer.appendChild(this.createButton("View", "my-view"));
        issuer.appendChild(this.createButton("Remove", "my-remove"));
        this.appendChild(issuer);
    }
    addClient(client) {
        this.appendChild(client);
    }
    removeClient(value) {
        this.getElementsByTagName("my-client").forEach(e => {
            if (value === e.value) {
                this.removeChild(e);
            }
        });
    }
}
class MyAddIssuer extends HTMLElement {
    constructor() {
        super();
    }
    createButton(value, name) {
        const input = document.createElement("button");
        input.innerText = value;
        input.addEventListener("click", () => this.dispatchEvent(new CustomEvent(name || "my-click")));
        return input;
    }
    connectedCallback() {
        this.appendChild(this.createButton("Add Issuer", "my-add-issuer"));
    }
}
class MyClient extends HTMLElement {
    constructor() {
        super();
    }
    set value(value) {
        this._value = value;
    }
    get value() {
        return this._value;
    }
    createButton(value, name) {
        const input = document.createElement("button");
        input.innerText = value;
        input.addEventListener("click", () => this.dispatchEvent(new CustomEvent(name || "my-click")));
        return input;
    }
    connectedCallback() {
        this.className = "client";
        this._span = document.createElement("span");
        this._span.innerText = this.value;
        this.appendChild(this._span);
        this.appendChild(this.createButton("Set Active", "my-set-active"));
        this.appendChild(this.createButton("View", "my-view"));
        this.appendChild(this.createButton("Remove", "my-remove"));
    }
}

function defineCustomElements() {
    customElements.define("my-issuer", MyIssuer);
    customElements.define("my-add-issuer", MyAddIssuer);
    customElements.define("my-client", MyClient);
}

export { MyIssuer, MyAddIssuer, MyClient, defineCustomElements }
