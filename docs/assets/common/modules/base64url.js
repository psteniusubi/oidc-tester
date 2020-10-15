/*
 * Base64 decode url safe
 * https://tools.ietf.org/html/rfc7515#appendix-C
 * https://tools.ietf.org/html/rfc4648#section-5
 */
function atobUrlSafe(text) {
    if (text == null) {
        return null;
    }
    text = text
        .replace(/\s+/g, "") // removes whitespace such as linefeeds from input encoded string
        .replace(/-/g, "+") // replace '-' with '+'
        .replace(/_/g, "/"); // replace '_' with '/'
    switch (text.length % 4) {
        case 2: text += "=="; break;
        case 3: text += "="; break;
        default: break; // if padding is wrong then eventually the atob call below fails
    }
    return atob(text);
}

/*
 * Base64 encode url safe
 * https://tools.ietf.org/html/rfc7515#appendix-C
 * https://tools.ietf.org/html/rfc4648#section-5
 */
function btoaUrlSafe(text) {
    if (text == null) {
        return null;
    }
    text = btoa(text)
        .replace(/\+/g, "-") // replace '+' with '-'
        .replace(/\//g, "_") // replace '/' with '_'
        .replace(/=+$/, ""); // remove trailing padding characters
    return text;
}

export { atobUrlSafe, btoaUrlSafe };
