const isNull = (value) => (value === null) || (value === undefined);
const isString = (value) => !isNull(value) && (typeof value === "string");
const has = (value, name) => (isNull(value) || !isString(name)) ? false : (name in value);

export class Configuration {
    constructor(name) {
        this.name = name || "config";
    }
    get_json() {
        const s = localStorage.getItem(this.name);
        if (isNull(s)) return {};
        const json = JSON.parse(s);
        if (!Object.isExtensible(json)) return {};
        return json;
    }
    save_json(json) {
        if (isNull(json)) return;
        localStorage.setItem(this.name, JSON.stringify(json));
    }
    add_issuer_metadata(metadata) {
        if (!has(metadata, "issuer")) throw "invalid issuer metadata";
        const json = this.get_json();
        const issuer = metadata.issuer;
        let r = false;
        if (!has(json, issuer)) {
            json[issuer] = {};
            r = true;
        }
        json[issuer].metadata = metadata;
        json[issuer].iat = Date.now();
        this.save_json(json);
        // return r ? this.get_issuer(issuer) : null;
        return r;
    }
    update_issuer_metadata(index, metadata) {
        this.add_issuer_metadata(metadata);
        if (index !== metadata.issuer) {
            const json = this.get_json();
            if (has(json, index)) {
                json[metadata.issuer].clients = json[index].clients;
                delete json[index];
                this.save_json(json);
            }
        }
    }
    get_issuer_list() {
        const json = this.get_json();
        const output = [];
        const active = this.get_active_issuer();
        for (const i of Object.keys(json)) {
            const t = json[i];
            output.push({
                index: i,
                iat: t.iat,
                active: i === active,
                text: `${t.iat} ${i}`
            });
        }
        return output;
    }
    internal_get_issuer(index) {
        const json = this.get_json();
        return has(json, index)
            ? json[index]
            : {};
    }
    get_issuer(index) {
        const issuer = this.internal_get_issuer(index);
        const active = this.get_active_issuer();
        return has(issuer, "iat")
            ? {
                index: index,
                iat: issuer.iat,
                active: index === active,
                text: `${issuer.iat} ${index}`
            }
            : {};
    }
    async get_issuer_metadata(index) {
        const issuer = this.internal_get_issuer(index);
        return has(issuer, "metadata")
            ? issuer.metadata
            : {};
    }
    remove_issuer(index) {
        const json = this.get_json();
        delete json[index];
        this.save_json(json);
    }
    add_client_metadata(index, metadata) {
        if (!has(metadata, "client_id")) throw "invalid client metadata";
        const json = this.get_json();
        if (!has(json, index)) return false;
        const issuer = json[index];
        if (!has(issuer, "clients")) {
            issuer.clients = {};
        }
        let r;
        let active = false;
        if (has(issuer.clients, metadata.client_id)) {
            // update
            r = false;
            if(has(issuer.clients[metadata.client_id], "active")) {
                active = issuer.clients[metadata.client_id].active;
            }
        } else {
            // new
            r = true;
        }
        metadata.iat = Date.now();
        issuer.clients[metadata.client_id] = metadata;
        this.save_json(json);
        if(active === true) {
            this.set_active(index, metadata.client_id);
        }
        return r;
    }
    update_client_metadata(index, client, metadata) {
        this.add_client_metadata(index, metadata);
        if (client !== metadata.client_id) {
            this.remove_client(index, client);
        }
    }
    get_uri(json) {
        if (has(json, "redirect_uris")) {
            return (json.redirect_uris.length > 0)
                ? json.redirect_uris[0]
                : "";
        } else {
            return "";
        }
    }
    get_client(index, client) {
        const issuer = this.internal_get_issuer(index);
        if (!has(issuer, "clients")) return {};
        if (has(issuer.clients, client)) {
            const t = issuer.clients[client];
            return {
                index: client,
                iat: t.iat,
                uri: this.get_uri(t),
                active: t.active === true,
                text: `${t.iat} ${client}`
            };
        } else {
            return {};
        }
    }
    get_client_list(index) {
        const issuer = this.internal_get_issuer(index);
        const output = [];
        if (has(issuer, "clients")) {
            for (const i of Object.keys(issuer.clients)) {
                const t = issuer.clients[i];
                output.push({
                    index: i,
                    iat: t.iat,
                    uri: this.get_uri(t),
                    active: t.active === true,
                    text: `${t.iat} ${i}`
                });
            }
        }
        return output;
    }
    async get_client_metadata(index, client) {
        const issuer = this.internal_get_issuer(index);
        if (!has(issuer, "clients")) return {};
        const metadata = issuer.clients[client];
        if (!has(metadata, "client_id")) return {};
        delete metadata["iat"];
        delete metadata["active"];
        return metadata;
    }
    remove_client(index, client) {
        const json = this.get_json();
        if (!has(json, index)) return;
        const issuer = json[index];
        if (!has(issuer, "clients")) return;
        delete issuer.clients[client];
        this.save_json(json);
    }
    set_active(index, client) {
        const json = this.get_json();
        for (const i of Object.keys(json)) {
            const issuer = json[i];
            if (has(issuer, "clients")) {
                for (const j of Object.keys(issuer.clients)) {
                    delete issuer.clients[j].active;
                }
            }
        }
        if (has(json, index)) {
            const issuer = json[index];
            if (has(issuer, "clients")) {
                if (has(issuer.clients, client)) {
                    issuer.clients[client].active = true;
                }
            }
        }
        this.save_json(json);
    }
    get_active_issuer() {
        const json = this.get_json();
        for (const i of Object.keys(json)) {
            const issuer = json[i];
            if (has(issuer, "clients")) {
                for (const j of Object.keys(issuer.clients)) {
                    if (issuer.clients[j].active === true) return i;
                }
            }
        }
        return null;
    }
    get_active_client() {
        const json = this.get_json();
        for (const i of Object.keys(json)) {
            const issuer = json[i];
            if (has(issuer, "clients")) {
                for (const j of Object.keys(issuer.clients)) {
                    if (issuer.clients[j].active === true) return j;
                }
            }
        }
        return null;
    }
    // is_active(index, client) {
    //     const json = this.get_json();
    //     return has(json, index)
    //         && has(json[index], "clients")
    //         && has(json[index].clients, client)
    //         && has(json[index].clients[client], "active")
    //         && (json[index].clients[client] === true);
    // }
}
