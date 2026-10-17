# Test support

The Jest tests use `fakeApi.ts` instead of the real backend. It serves `app.json`, a recorded
`GET /v1/me/app` response for the demo person in `data/demo-person.json`.

Refresh `app.json` after changing the demo person: start the backend, then

```sh
curl -s -H "Authorization: Bearer <customer-token>" http://localhost:8000/v1/me/app > test-support/app.json
```
