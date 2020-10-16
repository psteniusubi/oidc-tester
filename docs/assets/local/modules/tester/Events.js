const isNull = (value) => (value === null) || (value === undefined);

export class Events {
    static CODE = "oidc-code";
    static CODE_ERROR = "oidc-code-error";
    static CODE_RESET = "oidc-code-reset";
    static TOKEN = "oidc-token";
    static TOKEN_ERROR = "oidc-token-error";
    static TOKEN_RESET = "oidc-token-reset";
    static dispatch_code() {
        console.log("dispatch_code()");
        const detail = {
        };
        document.body.dispatchEvent(new CustomEvent(Events.CODE, { detail: detail }));
    }
    static dispatch_code_error() {
        console.log("dispatch_code_error()");
        const detail = {
        };
        document.body.dispatchEvent(new CustomEvent(Events.CODE_ERROR, { detail: detail }));
    }
    static dispatch_code_reset() {
        console.log("dispatch_code_reset()");
        const detail = {            
        };
        document.body.dispatchEvent(new CustomEvent(Events.CODE_RESET, { detail: detail }));
    }
    static dispatch_token() {
        console.log("dispatch_token()");
        const detail = {
        };
        document.body.dispatchEvent(new CustomEvent(Events.TOKEN, { detail: detail }));
    }
    static dispatch_token_error() {
        console.log("dispatch_token()");
        const detail = {
        };
        document.body.dispatchEvent(new CustomEvent(Events.TOKEN_ERROR, { detail: detail }));
    }
    static dispatch_token_reset() {
        console.log("dispatch_token_reset()");
        const detail = {            
        };
        document.body.dispatchEvent(new CustomEvent(Events.TOKEN_RESET, { detail: detail }));
    }
}
