import bcrypt
import hashlib

# Bcrypt has a 72-byte limit, so we'll hash longer passwords with SHA-256 first
BCRYPT_MAX_LENGTH = 72


def _prepare_password(password: str) -> bytes:
    """
    Prepare password for bcrypt hashing.
    If password is longer than 72 bytes, hash it with SHA-256 first.
    """
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > BCRYPT_MAX_LENGTH:
        # Hash with SHA-256 first, then bcrypt the hash
        sha256_hash = hashlib.sha256(password_bytes).digest()  # Use digest() not hexdigest() for bytes
        return sha256_hash
    return password_bytes


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    For passwords longer than 72 bytes, we hash with SHA-256 first.
    Returns a string representation of the bcrypt hash.
    """
    prepared_password = _prepare_password(password)
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(prepared_password, salt)
    # Return as string (bcrypt hash is already a string when decoded)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    Handles both short passwords (direct bcrypt) and long passwords (SHA-256 + bcrypt).
    """
    try:
        prepared_password = _prepare_password(plain_password)
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(prepared_password, hashed_bytes)
    except Exception:
        return False

