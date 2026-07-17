import pytest

VALID_USERS = [
    ("HP", "[HP123]"),
    ("JFrog", "[JFrog123]"),
    ("Elastic", "[Elastic123]"),
    ("F5", "[F5123]"),
    ("1PW", "[1PW123]"),
]


@pytest.mark.parametrize("username,password", VALID_USERS)
def test_login_valid_users(client, username, password):
    response = client.post(
        "/api/login", json={"username": username, "password": password}
    )
    assert response.status_code == 200
    assert response.cookies.get("heatmap_session")


def test_login_wrong_password(client):
    response = client.post("/api/login", json={"username": "HP", "password": "wrong"})
    assert response.status_code == 401


def test_login_unknown_user(client):
    response = client.post("/api/login", json={"username": "Nobody", "password": "x"})
    assert response.status_code == 401


def test_board_requires_auth(client):
    response = client.get("/api/board")
    assert response.status_code == 401


def test_board_rejects_tampered_cookie(client):
    client.cookies.set("heatmap_session", "HP.deadbeef")
    response = client.get("/api/board")
    assert response.status_code == 401


def test_logout_clears_session(hp_client):
    assert hp_client.get("/api/board").status_code == 200
    hp_client.post("/api/logout")
    assert hp_client.get("/api/board").status_code == 401
