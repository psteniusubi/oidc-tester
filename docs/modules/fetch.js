export class HttpClient {
    create_request(input, init) {
        return new Request(input, init);
    }
    async fetch(request) {
        return await window.fetch(request);
    }
    async invoke(request) {
        const response = await this.fetch(request);
        if (!response.ok) throw http_error(request, response);
        return response;
    }
    async get(uri) {
        const request = this.create_request(uri, {
            method: "GET"
        });
        const response = await this.invoke(request);
        return await http_to_json(response);
    }
    async get_html(uri) {
        const request = this.create_request(uri, {
            method: "GET"
        });
        const response = await this.invoke(request);
        const text = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(text, "text/html");
    }
    async post(uri, body) {
        const request = this.create_request(uri, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body
        });
        const response = await this.invoke(request);
        return await http_to_json(response);
    }
    async post_json(uri, body) {
        const request = this.create_request(uri, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body
        });
        const response = await this.invoke(request);
        return await http_to_json(response);
    }
    async put(uri, body) {
        const request = this.create_request(uri, {
            method: "PUT",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body
        });
        const response = await this.invoke(request);
        return await http_to_json(response);
    }
    async put_json(uri, body) {
        const request = this.create_request(uri, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: body
        });
        const response = await this.invoke(request);
        return await http_to_json(response);
    }
    async delete(uri) {
        const request = this.create_request(uri, {
            method: "DELETE"
        });
        const response = await this.invoke(request);
        return await http_to_json(response);
    }
}

const http_error = (request, response) => ({
    "error": "http_error",
    "http_request": request,
    "http_status": response.status,
    "http_response": response
});

const http_to_json = async (response) => (response.status !== 204) ? await response.json() : null;

const http = new HttpClient();

const http_get = async (uri) => await http.get(uri);
const http_get_html = async (uri) => await http.get_html(uri);
const http_post = async (uri, body) => await http.post(uri, body);
const http_post_json = async (uri, body) => await http.post_json(uri, body);
const http_put = async (uri, body) => await http.put(uri, body);
const http_put_json = async (uri, body) => await http.put_json(uri, body);
const http_delete = async (uri) => await http.delete(uri);

export { http_get, http_get_html, http_post, http_post_json, http_put, http_put_json, http_delete };
