# JWT Configuration

JWT is currently only enforced for deleting persisted realms.

```jsonc
{
    // ...
    "jwt": {
        "issuer": "", // The expected issuer
        "audience": "", // The expected audience
        "publicKey": "", // Auth server's public key
        "nameClaim": "", // The name of the "user name" claim
        "rolesClaim": "", // The name of the "roles" claim (array)
        "ignoreExpiredTokens": false, // Specifies whether to ignore tokens which have expired
        "adminRoleName": "" // The name of the admin role
    }
}
```

Example config:

```json
{
    // ...
    "jwt": {
        "issuer": "https://example.com/tenant",
        "audience": "hs-some-game",
        "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
        "nameClaim": "full_name",
        "rolesClaim": "roles",
        "ignoreExpiredTokens": true,
        "adminRoleName": "admin"
    }
}
```

Clients send an identification packet:

```
~jwt eyJhbGci...
```

If they are a valid user they can delete a persisted realm:

```
x12345
```