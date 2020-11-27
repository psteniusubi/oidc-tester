# OpenID Connect Tester

This is a browser based tester for OAuth 2.0 and OpenID Connect Authorization Code flow. Launch by navigating to following page

https://psteniusubi.github.io/oidc-tester

## Requirements

This browser based app requires CORS support from the OpenID Connect provider for the Token Endpoint. Most providers will support CORS but there are some exceptions.

There is no backend. Browser's [local storage](https://html.spec.whatwg.org/multipage/webstorage.html#webstorage) is used to store any configuration information such as provider metadata and client credentials.

# Registering OpenID Connect provider

Navigate to [Configuration](https://psteniusubi.github.io/oidc-tester/configuration.html) page, then below Identity Provider click New

Get one of following from your OpenID Connect provider

1. Issuer name that resolves to well known discovery endpoint
   - Enter name into Issuer field, then click Fetch
1. Discovery document as Json
   - Copy Json document on Clipboard, then click Paste from Clipboard
1. Values for authorization and token endpoints, and optionally others
   - Enter endpoint values into respective fields

# Registering OpenID Connect client

Navigate to [Configuration](https://psteniusubi.github.io/oidc-tester/configuration.html) page. Select a provider from list, then below Client click New

Register this app with the OpenID Connect provider

1. Send Client configuration request to provider
   1. Click Copy to Clipboard
   1. Submit registration request to provider. 
   1. Copy registration response on Clipboard, then click Paste from Clipboard
1. Send redirect uri to provider
   1. https://psteniusubi.github.io/oidc-tester/authorization-code-flow.html
   1. Get client_id and optionally client_secret values from provider, enter into respective fields

Remember to click Set Active to activate a client.

# OpenID Connect requests

Navigate to [Tester](https://psteniusubi.github.io/oidc-tester/authorization-code-flow.html) to start testing

## Authorization Request

## Token Request

## ID Token

## Introspection Request

## UserInfo Request
