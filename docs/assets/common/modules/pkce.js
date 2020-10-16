import { atobUrlSafe, btoaUrlSafe } from "./base64url.js";

function get_code_challenge_methods() {
    return ["plain", "S256"];
}

async function new_code_verifier(method) {
    switch (method) {
        case "plain":
        case "S256":
            return btoaUrlSafe(Array.from(window.crypto.getRandomValues(new Uint8Array(32)), t => String.fromCharCode(t)).join(""))
        case "":
        case null:
            return null;
        default:
            throw "invalid argument";
    }
}

async function get_code_challenge(method, code_verifier) {
    switch (method) {
        case "plain":
            if (code_verifier === null) throw "invalid argument";
            return code_verifier;
        case "S256":
            if (code_verifier === null) throw "invalid argument";
            let bytes = Uint8Array.from(code_verifier, t => t.charCodeAt(0));
            bytes = await window.crypto.subtle.digest("SHA-256", bytes);
            return btoaUrlSafe(Array.from(new Uint8Array(bytes), t => String.fromCharCode(t)).join(""));
        case "":
        case null:
            return null;
        default:
            throw "invalid argument";
    }
}

export { get_code_challenge_methods, new_code_verifier, get_code_challenge };
