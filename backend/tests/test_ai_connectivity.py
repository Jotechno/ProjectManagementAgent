from unittest.mock import MagicMock
import pytest
from app.ai import GEMINI_MODEL, ask_gemini, get_gemini_client


def test_get_gemini_client_raises_when_api_key_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
        get_gemini_client()


def test_ask_gemini_uses_gemini_3_8_flash_model() -> None:
    mock_client = MagicMock()
    mock_interaction = MagicMock()
    mock_interaction.output_text = " 4 \n"
    mock_client.interactions.create.return_value = mock_interaction

    result = ask_gemini("¿Cuánto es 2+2?", client=mock_client)

    assert result == "4"
    mock_client.interactions.create.assert_called_once_with(
        model=GEMINI_MODEL,
        input="¿Cuánto es 2+2?",
    )
    assert GEMINI_MODEL == "gemini-3.8-flash"


def test_real_gemini_connectivity_two_plus_two() -> None:
    answer = ask_gemini("¿Cuánto es 2+2? Responde únicamente con el número.")
    assert "4" in answer

