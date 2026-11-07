from typing import Any
from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.db import get_board_for_user, update_board_for_user
from app.schemas import BoardDataSchema

router = APIRouter(prefix="/api/board", tags=["board"])


@router.get("", response_model=BoardDataSchema)
def read_board(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> BoardDataSchema:
    raw_board = get_board_for_user(int(current_user["id"]))
    return BoardDataSchema.model_validate(raw_board)


@router.put("", response_model=BoardDataSchema)
def save_board(
    board: BoardDataSchema,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> BoardDataSchema:
    serialized = board.model_dump()
    updated = update_board_for_user(int(current_user["id"]), serialized)
    return BoardDataSchema.model_validate(updated)

