import { http_get } from "./fetch.js";

export class Configuration {
    constructor(name) {
        this.name = name || "config";
    }
    get_json() {
        const s = localStorage.getItem(this.name);
        if (s == null) return {};
        const json = JSON.parse(s);
        if (!Object.isExtensible(json)) return {};
        return json;
    }
    save_json(json) {
        if (json == null) return;
        localStorage.setItem(this.name, JSON.stringify(json));
    }
    add_issuer_metadata(metadata) {
        if (!("issuer" in metadata)) throw "invalid issuer metadata";
        const json = this.get_json();
        const issuer = metadata.issuer;
        let r = false;
        if (!(issuer in json)) {
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
            if (index in json) {
                json[metadata.issuer].clients = json[index].clients;
                delete json[index];
                this.save_json(json);
            }
        }
    }
    get_issuer_list() {
        const json = this.get_json();
        const output = [];
        for (const i of Object.keys(json)) {
            const t = json[i];
            output.push({
                index: i,
                iat: t.iat,
                text: `${t.iat} ${i}`
            });
        }
        return output;
    }
    internal_get_issuer(index) {
        const json = this.get_json();
        return (index in json)
            ? json[index]
            : {};
    }
    get_issuer(index) {
        const issuer = this.internal_get_issuer(index);
        return ("iat" in issuer)
            ? {
                index: index,
                iat: issuer.iat,
                text: `${issuer.iat} ${index}`
            }
            : {};
    }
    async get_issuer_metadata(index) {
        const issuer = this.internal_get_issuer(index);
        return ("metadata" in issuer)
            ? issuer.metadata
            : {};
    }
    remove_issuer(index) {
        const json = this.get_json();
        delete json[index];
        this.save_json(json);
    }
    add_client_metadata(index, metadata) {
        if (!("client_id" in metadata)) throw "invalid client metadata";
        const json = this.get_json();
        if (!(index in json)) return false;
        const issuer = json[index];
        if (!("clients" in issuer)) {
            issuer.clients = {};
        }
        let r = false;
        if (!(metadata.client_id in issuer.clients)) {
            r = true;
        }
        metadata.iat = Date.now();
        issuer.clients[metadata.client_id] = metadata;
        this.save_json(json);
        return r;
    }
    update_client_metadata(index, client, metadata) {
        this.add_client_metadata(index, metadata);
        if (client !== metadata.client_id) {
            this.remove_client(index, client);
        }
    }
    get_uri(json) {
        if("redirect_uris" in json) {
            return (json.redirect_uris.length > 0)
                ? json.redirect_uris[0]
                : "";
        } else {
            return "";
        }
    }
    get_client(index, client) {
        const issuer = this.internal_get_issuer(index);
        if (!("clients" in issuer)) return {};
        if (client in issuer.clients) {
            const t = issuer.clients[client];
            return {
                index: client,
                iat: t.iat,
                uri: this.get_uri(t),
                text: `${t.iat} ${client}`
            };
        } else {
            return {};
        }
    }
    get_client_list(index) {
        const issuer = this.internal_get_issuer(index);
        const output = [];
        if ("clients" in issuer) {
            for (const i of Object.keys(issuer.clients)) {
                const t = issuer.clients[i];
                output.push({
                    index: i,
                    iat: t.iat,
                    uri: this.get_uri(t),
                    text: `${t.iat} ${i}`
                });
            }
        }
        return output;
    }
    async get_client_metadata(index, client) {
        const issuer = this.internal_get_issuer(index);
        if (!("clients" in issuer)) return {};
        const metadata = issuer.clients[client];
        if (!("client_id" in metadata)) return {};
        delete metadata["iat"];
        delete metadata["active"];
        return metadata;
    }
    remove_client(index, client) {
        const json = this.get_json();
        if (!(index in json)) return;
        const issuer = json[index];
        if (!("clients" in issuer)) return;
        delete issuer.clients[client];
        this.save_json(json);
    }
    set_active(index, client) {
        const json = this.get_json();
        for (const i of Object.keys(json)) {
            const issuer = json[i];
            if ("clients" in issuer) {
                for (const j of Object.keys(issuer.clients)) {
                    delete issuer.clients[j].active;
                }
            }
        }
        if (index in json) {
            const issuer = json[index];
            if ("clients" in issuer) {
                if (client in issuer.clients) {
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
            if ("clients" in issuer) {
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
            if ("clients" in issuer) {
                for (const j of Object.keys(issuer.clients)) {
                    if (issuer.clients[j].active === true) return j;
                }
            }
        }
        return null;
    }
}
