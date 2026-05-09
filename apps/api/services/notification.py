from twilio.rest import Client
from config import settings
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.client = None
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    async def send_sms(self, to_phone: str, message: str):
        if not self.client:
            logger.warning(f"Twilio not configured. Message to {to_phone}: {message}")
            return False
            
        try:
            self.client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=to_phone
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return False

    async def trigger_sos_notifications(self, user_name: str, lat: float, lng: float, contacts: list):
        track_url = f"https://safeguard.app/track/{user_name}" # Example
        message = f"URGENT: {user_name} has triggered an SOS! Live location: {track_url}"
        
        for contact in contacts:
            await self.send_sms(contact["phone"], message)

notification_service = NotificationService()
