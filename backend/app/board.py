import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .auth import get_current_username
from .db import get_db
from .models import Account, Board, Entry, Technology
from .schemas import AccountOut, BoardIn, BoardOut, EntryOut, TechnologyOut

DEFAULT_TECHNOLOGY_NAMES = [
    "AI Tools",
    "AI Strategy",
    "Data Governance",
    "Cloud Infrastructure",
    "Security",
    "Analytics",
    "DevOps",
    "Integration",
    "Automation",
    "Compliance",
]

router = APIRouter()


def _get_or_create_board(db: Session, username: str) -> Board:
    board = db.query(Board).filter(Board.username == username).one_or_none()
    if board is not None:
        return board

    board = Board(id=str(uuid.uuid4()), username=username, title="Account Heat Map")
    db.add(board)
    db.flush()

    for i, name in enumerate(DEFAULT_TECHNOLOGY_NAMES):
        db.add(
            Technology(
                id=str(uuid.uuid4()),
                board_id=board.id,
                name=name,
                position=i,
                is_next_steps=False,
            )
        )
    db.add(
        Technology(
            id=str(uuid.uuid4()),
            board_id=board.id,
            name="Next steps",
            position=len(DEFAULT_TECHNOLOGY_NAMES),
            is_next_steps=True,
        )
    )
    db.commit()
    db.refresh(board)
    return board


def _serialize(board: Board) -> BoardOut:
    accounts = []
    for account in sorted(board.accounts, key=lambda a: a.position):
        cells: dict[str, list[EntryOut]] = {}
        for entry in sorted(account.entries, key=lambda e: e.position):
            cells.setdefault(entry.technology_id, []).append(
                EntryOut(id=entry.id, text=entry.text)
            )
        accounts.append(AccountOut(id=account.id, name=account.name, cells=cells))

    technologies = [
        TechnologyOut(id=t.id, name=t.name, is_next_steps=t.is_next_steps)
        for t in sorted(board.technologies, key=lambda t: t.position)
    ]

    return BoardOut(title=board.title, technologies=technologies, accounts=accounts)


@router.get("/api/board")
def get_board(
    username: str = Depends(get_current_username), db: Session = Depends(get_db)
) -> BoardOut:
    board = _get_or_create_board(db, username)
    return _serialize(board)


@router.put("/api/board")
def put_board(
    payload: BoardIn,
    username: str = Depends(get_current_username),
    db: Session = Depends(get_db),
) -> dict:
    board = _get_or_create_board(db, username)
    board.title = payload.title

    # Full replace: clear accounts (cascades entries) then technologies.
    board.accounts.clear()
    board.technologies.clear()
    db.flush()

    # Enforce the "exactly one pinned Next steps column, name immutable"
    # invariant server-side too, regardless of what the client sends.
    valid_technology_ids: set[str] = set()
    seen_pinned = False
    for i, tech in enumerate(payload.technologies):
        is_pinned = tech.is_next_steps and not seen_pinned
        seen_pinned = seen_pinned or is_pinned
        technology_id = tech.id or str(uuid.uuid4())
        valid_technology_ids.add(technology_id)
        db.add(
            Technology(
                id=technology_id,
                board_id=board.id,
                name="Next steps" if is_pinned else tech.name,
                position=i,
                is_next_steps=is_pinned,
            )
        )
    if not seen_pinned:
        technology_id = str(uuid.uuid4())
        valid_technology_ids.add(technology_id)
        db.add(
            Technology(
                id=technology_id,
                board_id=board.id,
                name="Next steps",
                position=len(payload.technologies),
                is_next_steps=True,
            )
        )

    # Cells referencing a technology id that isn't part of this same payload
    # (e.g. a stale id from a client that didn't clean up on column delete)
    # are dropped rather than trusted, so the DB never holds orphaned entries.
    for i, acc in enumerate(payload.accounts):
        account_id = acc.id or str(uuid.uuid4())
        db.add(Account(id=account_id, board_id=board.id, name=acc.name, position=i))
        for technology_id, entries in acc.cells.items():
            if technology_id not in valid_technology_ids:
                continue
            for j, entry in enumerate(entries):
                db.add(
                    Entry(
                        id=entry.id or str(uuid.uuid4()),
                        account_id=account_id,
                        technology_id=technology_id,
                        text=entry.text,
                        position=j,
                    )
                )

    db.commit()
    return {"ok": True}
