import httpx
from typing import Dict, Any, Optional
from config import settings
import logging

logger = logging.getLogger(__name__)

class AadhaarService:
    def __init__(self):
        self.base_url = settings.SANDBOX_BASE_URL
        self.api_key = settings.SANDBOX_API_KEY
        self.api_secret = settings.SANDBOX_API_SECRET
        self.version = "1.0"
        self._access_token: Optional[str] = None

    async def _get_access_token(self) -> str:
        """Authenticate with Sandbox and get a JWT token."""
        if self._access_token:
            return self._access_token

        url = f"{self.base_url}/authenticate"
        headers = {
            "x-api-key": self.api_key,
            "x-api-secret": self.api_secret,
            "x-api-version": self.version,
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                self._access_token = data.get("access_token")
                return self._access_token
            except Exception as e:
                logger.error(f"Failed to authenticate with Sandbox: {e}")
                raise Exception("Aadhaar service authentication failed")

    async def send_otp(self, aadhaar_number: str) -> Dict[str, Any]:
        """Send OTP to the mobile number registered with Aadhaar."""
        token = await self._get_access_token()
        url = f"{self.base_url}/kyc/aadhaar/okyc/otp"
        headers = {
            "x-api-key": self.api_key,
            "authorization": token,
            "x-api-version": self.version,
            "Content-Type": "application/json"
        }
        payload = {"aadhaar_number": aadhaar_number}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Sandbox OTP send failed: {e.response.text}")
                return e.response.json()
            except Exception as e:
                logger.error(f"Unexpected error in send_otp: {e}")
                raise Exception("Failed to send Aadhaar OTP")

    async def verify_otp(self, otp: str, reference_id: str) -> Dict[str, Any]:
        """Verify the OTP and extract user details."""
        token = await self._get_access_token()
        url = f"{self.base_url}/kyc/aadhaar/okyc/otp/verify"
        headers = {
            "x-api-key": self.api_key,
            "authorization": token,
            "x-api-version": self.version,
            "Content-Type": "application/json"
        }
        payload = {
            "otp": otp,
            "reference_id": reference_id
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Sandbox OTP verify failed: {e.response.text}")
                return e.response.json()
            except Exception as e:
                logger.error(f"Unexpected error in verify_otp: {e}")
                raise Exception("Failed to verify Aadhaar OTP")

aadhaar_service = AadhaarService()
