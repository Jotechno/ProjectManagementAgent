from typing import Literal
from pydantic import BaseModel, Field, field_validator, model_validator

FIXED_COLUMNS = ["col-1", "col-2", "col-3", "col-4", "col-5"]


class CardSchema(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    details: str = ""

    @field_validator("id", "title")
    @classmethod
    def must_not_be_blank(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("El valor no puede estar vacío")
        return trimmed


class ColumnSchema(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    cardIds: list[str]

    @field_validator("id", "title")
    @classmethod
    def must_not_be_blank(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("El valor no puede estar vacío")
        return trimmed


class BoardDataSchema(BaseModel):
    columnOrder: list[str]
    columns: dict[str, ColumnSchema]
    cards: dict[str, CardSchema]

    @model_validator(mode="after")
    def validate_board_integrity(self) -> "BoardDataSchema":
        if self.columnOrder != FIXED_COLUMNS:
            raise ValueError(
                f"columnOrder debe contener exactamente {FIXED_COLUMNS}"
            )

        if set(self.columns.keys()) != set(FIXED_COLUMNS):
            raise ValueError(
                "Las claves de columns deben coincidir con las 5 columnas fijas"
            )

        seen_card_ids: list[str] = []
        for col_key, col in self.columns.items():
            if col.id != col_key:
                raise ValueError(
                    f"El id de la columna '{col.id}' no coincide con su clave '{col_key}'"
                )
            for card_id in col.cardIds:
                if card_id not in self.cards:
                    raise ValueError(
                        f"La tarjeta '{card_id}' en '{col_key}' no existe en cards"
                    )
                seen_card_ids.append(card_id)

        if len(seen_card_ids) != len(set(seen_card_ids)):
            raise ValueError(
                "Una tarjeta no puede aparecer duplicada en las columnas"
            )

        if set(seen_card_ids) != set(self.cards.keys()):
            raise ValueError(
                "Todas las tarjetas en cards deben estar asignadas a una columna"
            )

        for card_key, card in self.cards.items():
            if card.id != card_key:
                raise ValueError(
                    f"El id de la tarjeta '{card.id}' no coincide con su clave '{card_key}'"
                )

        return self


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("El contenido del mensaje no puede estar vacío")
        return trimmed


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("El mensaje no puede estar vacío")
        return trimmed


class AIChatOutput(BaseModel):
    reply: str = Field(
        min_length=1,
        description="Respuesta en español para el usuario.",
    )
    updated_board: BoardDataSchema | None = Field(
        default=None,
        description="Tablero Kanban completo actualizado si el usuario pidió cambios; null si solo es conversación o consulta.",
    )

    @field_validator("reply")
    @classmethod
    def reply_must_not_be_blank(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("La respuesta de la IA no puede estar vacía")
        return trimmed
