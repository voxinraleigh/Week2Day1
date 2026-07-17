from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class EntryIn(CamelModel):
    id: str | None = None
    text: str


class EntryOut(CamelModel):
    id: str
    text: str


class TechnologyIn(CamelModel):
    id: str | None = None
    name: str
    is_next_steps: bool = False


class TechnologyOut(CamelModel):
    id: str
    name: str
    is_next_steps: bool


class AccountIn(CamelModel):
    id: str | None = None
    name: str
    cells: dict[str, list[EntryIn]] = {}


class AccountOut(CamelModel):
    id: str
    name: str
    cells: dict[str, list[EntryOut]]


class BoardIn(CamelModel):
    title: str
    technologies: list[TechnologyIn]
    accounts: list[AccountIn]


class BoardOut(CamelModel):
    title: str
    technologies: list[TechnologyOut]
    accounts: list[AccountOut]


class LoginRequest(CamelModel):
    username: str
    password: str
