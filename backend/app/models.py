from sqlalchemy import ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Board(Base):
    __tablename__ = "boards"

    id: Mapped[str] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
    title: Mapped[str] = mapped_column(default="Account Heat Map")

    technologies: Mapped[list["Technology"]] = relationship(
        back_populates="board",
        cascade="all, delete-orphan",
        order_by="Technology.position",
    )
    accounts: Mapped[list["Account"]] = relationship(
        back_populates="board",
        cascade="all, delete-orphan",
        order_by="Account.position",
    )


class Technology(Base):
    __tablename__ = "technologies"

    id: Mapped[str] = mapped_column(primary_key=True)
    board_id: Mapped[str] = mapped_column(ForeignKey("boards.id"))
    name: Mapped[str]
    position: Mapped[int]
    is_next_steps: Mapped[bool] = mapped_column(default=False)

    board: Mapped[Board] = relationship(back_populates="technologies")


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(primary_key=True)
    board_id: Mapped[str] = mapped_column(ForeignKey("boards.id"))
    name: Mapped[str]
    position: Mapped[int]

    board: Mapped[Board] = relationship(back_populates="accounts")
    entries: Mapped[list["Entry"]] = relationship(
        back_populates="account",
        cascade="all, delete-orphan",
        order_by="Entry.position",
    )


class Entry(Base):
    __tablename__ = "entries"

    id: Mapped[str] = mapped_column(primary_key=True)
    account_id: Mapped[str] = mapped_column(ForeignKey("accounts.id"))
    technology_id: Mapped[str] = mapped_column(ForeignKey("technologies.id"))
    text: Mapped[str]
    position: Mapped[int]

    account: Mapped[Account] = relationship(back_populates="entries")
