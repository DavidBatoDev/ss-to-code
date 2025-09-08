from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_stacks():
    assert "html_tailwind" in client.get("/api/stacks").json()


def test_rejects_unknown_stack():
    r = client.post("/api/generate", json={"image": "data:image/png;base64,AA", "stack": "cobol"})
    assert r.status_code == 400


def test_requires_input():
    r = client.post("/api/generate", json={"stack": "html_tailwind"})
    assert r.status_code == 400


def test_models():
    body = client.get("/api/models").json()
    assert body["default"] in body["models"]


def test_rejects_unknown_model():
    r = client.post("/api/generate", json={"image": "data:image/png;base64,AA", "model": "evil-model"})
    assert r.status_code == 400
