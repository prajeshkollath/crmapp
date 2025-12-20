import firebase_admin
from firebase_admin import credentials, auth
import os
import json
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
_firebase_app = None

def init_firebase():
    global _firebase_app
    
    if _firebase_app:
        return _firebase_app
    
    # Check if already initialized
    if firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        return _firebase_app
    
    # Try to use service account JSON file first
    service_account_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    
    if service_account_path and os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase initialized with service account file")
    else:
        # Try environment variable with JSON content
        service_account_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
        if service_account_json:
            try:
                service_account_info = json.loads(service_account_json)
                cred = credentials.Certificate(service_account_info)
                _firebase_app = firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with service account JSON from env")
            except json.JSONDecodeError:
                logger.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON")
                raise ValueError("Invalid FIREBASE_SERVICE_ACCOUNT_JSON")
        else:
            # Initialize with project ID only (for ID token verification)
            project_id = os.environ.get('FIREBASE_PROJECT_ID', 'pythonapi-460914')
            _firebase_app = firebase_admin.initialize_app(
                options={'projectId': project_id}
            )
            logger.info(f"Firebase initialized with project ID: {project_id}")
    
    return _firebase_app


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded claims.
    
    Returns:
        dict: Decoded token claims including uid, email, etc.
    
    Raises:
        ValueError: If token is invalid or expired
    """
    init_firebase()
    
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise ValueError("Token has expired")
    except auth.RevokedIdTokenError:
        raise ValueError("Token has been revoked")
    except auth.InvalidIdTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Firebase token verification error: {str(e)}")
        raise ValueError(f"Token verification failed: {str(e)}")


def get_user_by_uid(uid: str):
    """
    Get Firebase user by UID.
    """
    init_firebase()
    
    try:
        return auth.get_user(uid)
    except auth.UserNotFoundError:
        return None
    except Exception as e:
        logger.error(f"Error getting user: {str(e)}")
        return None
