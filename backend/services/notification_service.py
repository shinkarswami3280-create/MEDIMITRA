"""
MediMitra — Notification Service Abstraction
Supports IN_APP (zero config, always works), WHATSAPP, and VOICE.
Includes simulated adapters so the app never fails without external credentials (Twilio).
"""
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from backend.models import Notification, NotificationChannel
from backend.core.config import settings

logger = logging.getLogger("medimitra.notifications")


class NotificationService:
    @staticmethod
    def send(
        db: Session,
        user_id: int,
        message: str,
        title: Optional[str] = "MediMitra Notification",
        channel: NotificationChannel = NotificationChannel.in_app,
        phone: Optional[str] = None,
    ) -> Notification:
        """
        Primary notification dispatcher.
        Always records in_app notification in database for user history.
        Dispatches to external adapter if channel is whatsapp/voice.
        """
        # 1. Save in-app notification record (Always works)
        notification = Notification(
            user_id=user_id,
            channel=channel,
            title=title,
            message=message,
            read=False,
            created_at=datetime.utcnow(),
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # 2. Dispatch to channel adapter
        if channel == NotificationChannel.whatsapp:
            NotificationService._dispatch_whatsapp(phone, message)
        elif channel == NotificationChannel.voice:
            NotificationService._dispatch_voice(phone, message)

        return notification

    @staticmethod
    def _dispatch_whatsapp(phone: Optional[str], message: str):
        if settings.twilio_enabled and phone:
            try:
                # Optional real Twilio dispatch
                from twilio.rest import Client
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                client.messages.create(
                    from_=f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}",
                    to=f"whatsapp:{phone}",
                    body=message,
                )
                logger.info(f"Dispatched live WhatsApp to {phone}")
                return
            except Exception as e:
                logger.warning(f"Twilio WhatsApp dispatch failed: {e}. Falling back to simulation.")

        # Simulated fallback
        logger.info(f"[SIMULATED WHATSAPP to {phone or 'user'}]: {message}")

    @staticmethod
    def _dispatch_voice(phone: Optional[str], message: str):
        if settings.twilio_enabled and phone and settings.TWILIO_VOICE_NUMBER:
            try:
                from twilio.rest import Client
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                twiml = f"<Response><Say voice='Polly.Aditi'>{message}</Say></Response>"
                client.calls.create(
                    twiml=twiml,
                    to=phone,
                    from_=settings.TWILIO_VOICE_NUMBER,
                )
                logger.info(f"Dispatched live Voice Call to {phone}")
                return
            except Exception as e:
                logger.warning(f"Twilio Voice dispatch failed: {e}. Falling back to simulation.")

        # Simulated fallback
        logger.info(f"[SIMULATED VOICE CALL to {phone or 'user'}]: {message}")


notification_service = NotificationService()
