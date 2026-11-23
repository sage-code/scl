#!/usr/bin/env python3
"""Decouple domain logic from persistence using dependency injection (Hexagonal style)."""

from typing import Protocol


class UserStore(Protocol):
    def find_email(self, user_id: int) -> str | None: ...


class InMemoryUserStore:
    def __init__(self, data: dict[int, str]) -> None:
        self._data = data

    def find_email(self, user_id: int) -> str | None:
        return self._data.get(user_id)


class WelcomeService:
    def __init__(self, store: UserStore) -> None:
        self._store = store

    def greeting_for(self, user_id: int) -> str:
        email = self._store.find_email(user_id)
        return f"Welcome, {email}!" if email else "User not found."


if __name__ == "__main__":
    service = WelcomeService(InMemoryUserStore({1: "ada@sagecode.org"}))
    print(service.greeting_for(1))
    print(service.greeting_for(99))
