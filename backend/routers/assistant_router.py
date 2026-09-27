"""
MediMitra — Assistant Router (WhatsApp & Voice Simulation & Webhooks)
Interactive simulated consoles + optional Twilio webhook adapters.
Enforces the mandatory medical question refusal rule.
"""
from fastapi import APIRouter, Depends, Form, Request, Response
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.schemas import AssistantMessage, AssistantResponse
from backend.services.assistant_service import assistant_service
from backend.core.deps import get_current_user

router = APIRouter(prefix="/api/assistant", tags=["WhatsApp & Voice Assistant"])


@router.post("/chat", response_model=AssistantResponse)
def assistant_chat(
    msg: AssistantMessage,
    db: Session = Depends(get_db),
):
    """
    Simulated chat interaction endpoint. Zero external API keys needed.
    """
    result = assistant_service.process_message(
        text=msg.message,
        channel=msg.channel,
        db=db,
    )
    return AssistantResponse(
        intent=result["intent"],
        response=result["response"],
        action_taken=result.get("action_taken"),
        is_simulated=True,
    )


@router.post("/voice/simulate", response_model=AssistantResponse)
def simulate_voice_call(
    msg: AssistantMessage,
    db: Session = Depends(get_db),
):
    """
    Simulated interactive phone call console. Zero credentials required.
    """
    result = assistant_service.process_message(
        text=msg.message,
        channel="voice",
        db=db,
    )
    return AssistantResponse(
        intent=result["intent"],
        response=result["response"],
        action_taken=result.get("action_taken"),
        is_simulated=True,
    )


# ─── Live Twilio Webhooks (optional when credentials configured) ───

@router.post("/webhook/whatsapp")
async def twilio_whatsapp_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Live WhatsApp webhook for Twilio integration.
    """
    form_data = await request.form()
    body = form_data.get("Body", "")
    from_number = form_data.get("From", "").replace("whatsapp:", "")

    result = assistant_service.process_message(
        text=body,
        user_phone=from_number,
        channel="whatsapp",
        db=db,
    )

    xml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{result["response"]}</Message>
</Response>"""
    return Response(content=xml_response, media_type="application/xml")


@router.post("/webhook/voice")
async def twilio_voice_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Live Voice webhook for Twilio inbound calls.
    """
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult", "help")

    result = assistant_service.process_message(
        text=speech_result,
        channel="voice",
        db=db,
    )

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">{result["response"]}</Say>
</Response>"""
    return Response(content=twiml, media_type="application/xml")
