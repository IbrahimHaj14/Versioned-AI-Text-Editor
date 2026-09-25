import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.schemas import AiEditRequest, ChatMessage, Attachment
from app.services.ai_service import process_ai_edit, sanitize_html, StructuredAiResponse



# HTML Sanitization Tests


def test_strips_dangerous_content():
    """Ensures script tags, iframes, and inline event handlers are removed."""
    raw_html = '<p>Safe paragraph</p><script>alert("xss")</script><iframe src="http://evil.com"></iframe>'
    clean = sanitize_html(raw_html)
    
    assert "<script>" not in clean
    assert "<iframe>" not in clean
    assert "Safe paragraph" in clean


def test_perserve_valid_tags():
    """Ensures valid editor formatting (headings, lists, bold, links) is preserved."""
    raw_html = '<h1>Title</h1><p>Text with <strong>bold</strong> and <a href="https://example.com">link</a></p>'
    clean = sanitize_html(raw_html)
    
    assert "<h1>Title</h1>" in clean
    assert "<strong>bold</strong>" in clean
    assert 'href="https://example.com"' in clean


#AI edit service testing

@pytest.mark.asyncio
async def test_process_ai_edit_success():
    """Verifies successful AI edit request returns updated sanitized HTML and summary."""
    request = AiEditRequest(
        document_html="<p>Claim 1: A device.</p>",
        instruction="Add claim 2.",
        chat_history=[],
        attachments=[]
    )

    mock_parsed_response = StructuredAiResponse(
        new_html="<p>Claim 1: A device.</p><p>Claim 2: The device of claim 1.</p>",
        summary="Added claim 2.",
        change_type="edit"
    )

    # Mock OpenAI API call
    mock_choice = MagicMock()
    mock_choice.message.parsed = mock_parsed_response
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    with patch("app.services.ai_service.client.beta.chat.completions.parse", new_callable=AsyncMock) as mock_parse:
        mock_parse.return_value = mock_response

        response = await process_ai_edit(request)

        assert response.change_type == "edit"
        assert response.summary == "Added claim 2."
        assert "<p>Claim 2: The device of claim 1.</p>" in response.new_html
        mock_parse.assert_called_once()


@pytest.mark.asyncio
async def test_ai_edit_history_and_attachments():
    """Ensures conversation history and attachment blocks are properly formatted into OpenAI payload."""
    request = AiEditRequest(
        document_html="<p>Original HTML</p>",
        instruction="Incorporate attachment details.",
        chat_history=[
            ChatMessage(role="user", content="Previous question"),
            ChatMessage(role="assistant", content="Previous answer")
        ],
        attachments=[
            Attachment(filename="prior_art.txt", content="Sample prior art text")
        ]
    )

    mock_parsed_response = StructuredAiResponse(
        new_html="<p>Updated HTML with prior art</p>",
        summary="Updated document using prior art context.",
        change_type="edit"
    )

    mock_choice = MagicMock()
    mock_choice.message.parsed = mock_parsed_response
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    with patch("app.services.ai_service.client.beta.chat.completions.parse", new_callable=AsyncMock) as mock_parse:
        mock_parse.return_value = mock_response

        await process_ai_edit(request)

        # Inspect messages passed
        call_kwargs = mock_parse.call_args.kwargs
        messages = call_kwargs["messages"]

        # Verify chat history propagation
        assert messages[1] == {"role": "user", "content": "Previous question"}
        assert messages[2] == {"role": "assistant", "content": "Previous answer"}

        # Verify payload contains attachment XML block and original document
        user_payload = messages[-1]["content"]
        assert '<attachment name="prior_art.txt">' in user_payload
        assert "Sample prior art text" in user_payload
        assert "<p>Original HTML</p>" in user_payload


@pytest.mark.asyncio
async def test_ai_exception_handling():
    """Verifies that API exceptions are caught and return no_change with original HTML."""
    request = AiEditRequest(
        document_html="<p>Original document content</p>",
        instruction="Break the system",
        chat_history=[],
        attachments=[]
    )

    # Simulate OpenAI failure or invalid API key
    with patch("app.services.ai_service.client.beta.chat.completions.parse", new_callable=AsyncMock) as mock_parse:
        mock_parse.side_effect = Exception("OpenAI API Key invalid or rate limit exceeded")

        response = await process_ai_edit(request)

        assert response.change_type == "no_change"
        assert response.new_html == "<p>Original document content</p>"
        assert "AI edit failed" in response.summary


@pytest.mark.asyncio
async def test_ai_no_change():
    """Verifies fallback when OpenAI returns a response where parsed is None."""
    request = AiEditRequest(
        document_html="<p>Unchanged content</p>",
        instruction="Make changes",
        chat_history=[],
        attachments=[]
    )

    mock_choice = MagicMock()
    mock_choice.message.parsed = None
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    with patch("app.services.ai_service.client.beta.chat.completions.parse", new_callable=AsyncMock) as mock_parse:
        mock_parse.return_value = mock_response

        response = await process_ai_edit(request)

        assert response.change_type == "no_change"
        assert response.new_html == "<p>Unchanged content</p>"
        assert response.summary == "Unable to parse AI response."