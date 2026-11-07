from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from app.ai import chat_with_kanban
from app.auth import get_current_user
from app.db import get_board_for_user, update_board_for_user
from app.schemas import AIChatOutput, BoardDataSchema, ChatRequest

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=AIChatOutput)
def post_chat(
    payload: ChatRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> AIChatOutput:
    user_id = int(current_user["id"])
    current_board_raw = get_board_for_user(user_id)
    current_board = BoardDataSchema.model_validate(current_board_raw)

    try:
        ai_result = chat_with_kanban(
            board=current_board,
            message=payload.message,
            history=payload.history,
        )
    except (ValidationError, ValueError, RuntimeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al procesar la respuesta de IA: {exc}",
        ) from exc

    if ai_result.updated_board is not None:
        update_board_for_user(
            user_id=user_id,
            board_data=ai_result.updated_board.model_dump(),
        )

    return ai_result

