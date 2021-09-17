import { atobUrlSafe } from "./base64url.js";

class Completion {
    constructor() {
        const executor = (resolve, reject) => {
            if ("_executor" in this) {
                this._executor(resolve, reject);
            } else {
                this._resolve = resolve;
                this._reject = reject;
            }
        };
        this._promise = new Promise(executor);
    }
    get task() { return this._promise; }
    resolve(value) {
        if ("_resolve" in this) {
            this._resolve(value);
        } else if (!("_executor" in this)) {
            this._executor = (resolve, reject) => resolve(value);
        }
    }
    reject(value) {
        if ("_reject" in this) {
            this._reject(value);
        } else if (!("_executor" in this)) {
            this._executor = (resolve, reject) => reject(value);
        }
    }
}

async function decode_jwt(jwt, jwks) {

    const jws = jwt.split(".");
    if (jws.length != 3) throw "invalid argument";

    if(!("keys" in jwks)) throw "invalid argument";

    const header = JSON.parse(atobUrlSafe(jws[0]));

    const body_string = atobUrlSafe(jws[1]);
    let body;
    try {
        const bytes = Uint8Array.from(body_string, t => t.charCodeAt(0));
        const s = new TextDecoder("utf-8").decode(bytes);
        body = JSON.parse(s);
    } catch {
        // ignore error
        body = null; 
    }

    const text2verify = Uint8Array.from(jws[0] + "." + jws[1], t => t.charCodeAt(0));

    const signature = Uint8Array.from(atobUrlSafe(jws[2]), t => t.charCodeAt(0));

    function isSig(jwk) {
        return (jwk.use == null || jwk.use == "sig");
    }

    function toCryptoKey(jwk) {
        // TODO: support EC and oct keys
        return {
            "kty": jwk.kty,
            "n": jwk.n,
            "e": jwk.e
        };
    }

    function toCyptoAlg(jwk) {
        // TODO: support more algorithms
        return {
            name: "RSASSA-PKCS1-v1_5",
            hash: { name: "SHA-256" },
        };
    }

    const keys = jwks.keys
        .filter(isSig);

    const completion = new Completion();
    let done = false;

    async function try_verify(jwk, n) {
        if (done) return;
        let result = false;
        try {
            const alg = toCyptoAlg(jwk);
            const key = await window.crypto.subtle.importKey("jwk", toCryptoKey(jwk), alg, false, ["verify"]);
            result = await window.crypto.subtle.verify(alg, key, signature, text2verify);
        } finally {
            if (result === true) {
                completion.resolve(jwk);
                done = true;
            } else if (n === 0) {
                completion.reject("cannot verify");
                done = true;
            }
        }
    }

    let todo = keys.length;
    if (todo > 0) {
        for (const jwk of keys) {
            try_verify(jwk, --todo);
        }
    } else {
        throw "key not found";
    }

    return {
        header: header,
        body_string: body_string,
        body: body,
        jwk: await completion.task,
    };
}

export { decode_jwt };
