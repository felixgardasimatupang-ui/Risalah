"""API key auth middleware tests — FastAPI TestClient."""

import os
from unittest.mock import patch

os.environ["RISALAH_API_KEY"] = "test-key-123"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAuth:
    """Middleware blocks requests without valid key when API key is set."""

    EXCLUDED = ["/", "/api/v1/health", "/docs", "/openapi.json", "/redoc"]

    def test_health_bypasses_auth(self):
        resp = client.get("/api/v1/health")
        # Health endpoint bypasses auth; may 404 if no handler, but not 401
        assert resp.status_code != 401

    def test_root_bypasses_auth(self):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_docs_bypasses_auth(self):
        resp = client.get("/docs")
        assert resp.status_code != 401

    def test_protected_endpoint_rejects_no_key(self):
        resp = client.get("/api/v1/meetings")
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Missing or invalid API key"

    def test_protected_endpoint_rejects_wrong_key(self):
        resp = client.get("/api/v1/meetings", headers={"X-API-Key": "wrong-key"})
        assert resp.status_code == 401

    def test_protected_endpoint_accepts_valid_key(self):
        # May 200 or 404 depending on data, but not 401
        resp = client.get("/api/v1/meetings", headers={"X-API-Key": "test-key-123"})
        assert resp.status_code != 401


class TestAuthDisabled:
    """When RISALAH_API_KEY is empty, auth is disabled."""

    @patch("app.main.settings.api_key", "")
    def test_no_key_configured_passes_all(self):
        resp = client.get("/api/v1/meetings")
        # Should NOT be 401 since auth is disabled
        assert resp.status_code != 401
