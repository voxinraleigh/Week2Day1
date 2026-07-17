def test_board_auto_creates_with_seed_data(hp_client):
    board = hp_client.get("/api/board").json()
    assert board["title"] == "Account Heat Map"
    assert len(board["technologies"]) == 11  # 10 default + 1 pinned
    pinned = [t for t in board["technologies"] if t["isNextSteps"]]
    assert len(pinned) == 1
    assert pinned[0]["name"] == "Next steps"
    assert board["accounts"] == []


def test_per_user_isolation(client):
    client.post("/api/login", json={"username": "HP", "password": "[HP123]"})
    hp_board = client.get("/api/board").json()
    hp_board["title"] = "HP Only"
    client.put("/api/board", json=hp_board)

    client.post("/api/logout")
    client.post("/api/login", json={"username": "JFrog", "password": "[JFrog123]"})
    jfrog_board = client.get("/api/board").json()
    assert jfrog_board["title"] == "Account Heat Map"


def test_full_crud_roundtrip(hp_client):
    board = hp_client.get("/api/board").json()
    tech_id = board["technologies"][0]["id"]
    board["title"] = "Renamed"
    board["accounts"] = [
        {
            "id": "acc-1",
            "name": "Acme",
            "cells": {tech_id: [{"id": "e-1", "text": "hello"}]},
        }
    ]
    assert hp_client.put("/api/board", json=board).status_code == 200

    fetched = hp_client.get("/api/board").json()
    assert fetched["title"] == "Renamed"
    assert len(fetched["accounts"]) == 1
    assert fetched["accounts"][0]["name"] == "Acme"
    assert fetched["accounts"][0]["cells"][tech_id][0]["text"] == "hello"


def test_column_delete_removes_its_cells(hp_client):
    board = hp_client.get("/api/board").json()
    tech_id = board["technologies"][0]["id"]
    board["accounts"] = [
        {"id": "acc-1", "name": "Acme", "cells": {tech_id: [{"id": "e-1", "text": "x"}]}}
    ]
    hp_client.put("/api/board", json=board)

    board = hp_client.get("/api/board").json()
    board["technologies"] = [t for t in board["technologies"] if t["id"] != tech_id]
    hp_client.put("/api/board", json=board)

    fetched = hp_client.get("/api/board").json()
    assert all(t["id"] != tech_id for t in fetched["technologies"])
    assert tech_id not in fetched["accounts"][0]["cells"]


def test_reorder_technologies(hp_client):
    board = hp_client.get("/api/board").json()
    normal = [t for t in board["technologies"] if not t["isNextSteps"]]
    pinned = [t for t in board["technologies"] if t["isNextSteps"]]
    reordered = list(reversed(normal)) + pinned
    board["technologies"] = reordered
    hp_client.put("/api/board", json=board)

    fetched = hp_client.get("/api/board").json()
    assert [t["id"] for t in fetched["technologies"]] == [t["id"] for t in reordered]


def test_reorder_accounts(hp_client):
    board = hp_client.get("/api/board").json()
    board["accounts"] = [
        {"id": "a", "name": "A", "cells": {}},
        {"id": "b", "name": "B", "cells": {}},
    ]
    hp_client.put("/api/board", json=board)

    board = hp_client.get("/api/board").json()
    board["accounts"] = list(reversed(board["accounts"]))
    hp_client.put("/api/board", json=board)

    fetched = hp_client.get("/api/board").json()
    assert [a["name"] for a in fetched["accounts"]] == ["B", "A"]


def test_pinned_column_cannot_be_deleted_via_api(hp_client):
    board = hp_client.get("/api/board").json()
    board["technologies"] = [t for t in board["technologies"] if not t["isNextSteps"]]
    hp_client.put("/api/board", json=board)

    fetched = hp_client.get("/api/board").json()
    pinned = [t for t in fetched["technologies"] if t["isNextSteps"]]
    assert len(pinned) == 1
    assert pinned[0]["name"] == "Next steps"


def test_pinned_column_name_is_not_renamable_via_api(hp_client):
    board = hp_client.get("/api/board").json()
    for t in board["technologies"]:
        if t["isNextSteps"]:
            t["name"] = "Renamed Somehow"
    hp_client.put("/api/board", json=board)

    fetched = hp_client.get("/api/board").json()
    pinned = [t for t in fetched["technologies"] if t["isNextSteps"]]
    assert len(pinned) == 1
    assert pinned[0]["name"] == "Next steps"
