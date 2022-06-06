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

// https://datatracker.ietf.org/doc/html/rfc7518#section-3.1
// We don't validate that the key type matches the type implied by the alg
const algToHashFunction = {
    "RS256": "SHA-256",
    "RS384": "SHA-384",
    "RS512": "SHA-512",
    "ES256": "SHA-256",
    "ES384": "SHA-384",
    "ES512": "SHA-512",
}

async function decode_jwt(jwt, jwks) {

    const jws = jwt.split(".");
    if (jws.length != 3) throw "invalid argument";

    if(!("keys" in jwks)) throw "invalid argument";

    const header = JSON.parse(atobUrlSafe(jws[0]));

    let hash = algToHashFunction[header.alg];
    if (!hash) {
        console.warn("Unsupported JWT alg: " + hash + ".");
        hash = "SHA-256";
    }

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

    // Slightly unclean: result used as both key import and verify arguments, although they use different properties
    // which hash function to use is derived from the JWT headers "alg" property.
    function toCyptoAlg(jwk) {
        if (jwk.kty === "EC") {
            return {
                name: "ECDSA",
                // Some named curves may be unsupported. The docs officially only
                // name three NIST curves: P-256, P-384, P-521
                // https://w3c.github.io/webcrypto/#dfn-NamedCurve
                namedCurve: jwk.crv,
                hash: {name: hash},
            };
        } else if (jwk.kty === "RSA") {
            return {
                name: "RSASSA-PKCS1-v1_5",
                hash: {name: hash},
            };
        } else {
            // TODO: support oct
            throw new Error(`Unsupported JWK kty '${jwk.kty}'`);
        }
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
            const key = await window.crypto.subtle.importKey("jwk", jwk, alg, false, ["verify"]);
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

    if (header.kid) {
        // account for explicit key id referenced in JWT
        const key = keys.find(k => k.kid === header.kid);
        if (!key) {
            throw `key ${header.kid} not found`;
        }
        try_verify(key, 0);
    } else {
        // otherwise just try them all
        let todo = keys.length;
        if (todo > 0) {
            for (const jwk of keys) {
                try_verify(jwk, --todo);
            }
        } else {
            throw "key not found";
        }
    }

    return {
        header: header,
        body_string: body_string,
        body: body,
        jwk: await completion.task,
    };
}

export { decode_jwt };
