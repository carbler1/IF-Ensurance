"""The endpoints, the bearer token check, CORS, the upload. Shapes: docs/systemdesign/api-contract.md."""

from fastapi import FastAPI

app = FastAPI(title="If Life Partner")
