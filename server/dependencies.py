import bcrypt
from datetime import datetime, timezone
from typing import Optional, Any
from database import get_db
from config import settings


def hash_pin(pin: str) -> str:
    """Hash a 4-digit PIN using bcrypt."""
    return bcrypt.hashpw(pin.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_pin_hash(pin: str, pin_hash: Optional[str]) -> bool:
    """Verify a PIN against a bcrypt hash."""
    if not pin_hash:
        return False
    try:
        return bcrypt.checkpw(pin.encode("utf-8"), pin_hash.encode("utf-8"))
    except Exception:
        return False


def verify_admin_pin(pin: str) -> bool:
    """Verify PIN against ADMIN_PIN configured in settings."""
    return pin.strip() == settings.ADMIN_PIN.strip()


def dt_to_epoch_ms(dt: Optional[datetime]) -> Optional[int]:
    """Convert datetime to epoch milliseconds."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp() * 1000)


def epoch_ms_to_dt(ms: Optional[int]) -> Optional[datetime]:
    """Convert epoch milliseconds to timezone-aware datetime."""
    if ms is None:
        return None
    return datetime.fromtimestamp(ms / 1000.0, tz=timezone.utc)
