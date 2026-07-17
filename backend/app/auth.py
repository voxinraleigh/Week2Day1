import hashlib
import hmac

from fastapi import APIRouter, Cookie, HTTPException, Response, status

from .schemas import LoginRequest

SECRET_KEY = "dev-local-secret-do-not-use-in-prod"
COOKIE_NAME = "heatmap_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days

USERS = {
    "HP": "[HP123]",
    "JFrog": "[JFrog123]",
    "Elastic": "[Elastic123]",
    "F5": "[F5123]",
    "1PW": "[1PW123]",
}


def _sign(username: str) -> str:
    signature = hmac.new(
        SECRET_KEY.encode(), username.encode(), hashlib.sha256
    ).hexdigest()
    return f"{username}.{signature}"


def _verify(token: str) -> str | None:
    try:
        username, signature = token.rsplit(".", 1)
    except ValueError:
        return None
    expected = hmac.new(
        SECRET_KEY.encode(), username.encode(), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None
    if username not in USERS:
        return None
    return username


def get_current_username(
    heatmap_session: str | None = Cookie(default=None),
) -> str:
    username = _verify(heatmap_session) if heatmap_session else None
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    return username


router = APIRouter()


@router.post("/api/login")
def login(payload: LoginRequest, response: Response) -> dict:
    expected_password = USERS.get(payload.username)
    if expected_password is None or not hmac.compare_digest(
        payload.password, expected_password
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    response.set_cookie(
        COOKIE_NAME,
        _sign(payload.username),
        httponly=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
    )
    return {"ok": True}


@router.post("/api/logout")
def logout(response: Response) -> dict:
    response.delete_cookie(COOKIE_NAME)
    return {"ok": True}
