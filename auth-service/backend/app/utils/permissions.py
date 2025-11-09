"""
Permission checking utilities for role-based access control
"""
from app.models.user import UserInDB, UserRole
from typing import Optional


def can_edit_alert(user: Optional[UserInDB], alert_user_id: str) -> bool:
    """
    Check if user can edit an alert.
    Rules:
    - User can edit their own alerts
    - Trusted users and above can edit any alert
    """
    if not user:
        return False
    
    # User can always edit their own content
    if str(user.id) == alert_user_id:
        return True
    
    # Trusted users and above can edit any alert
    if user.role in [UserRole.TRUSTED_USER, UserRole.MODERATOR, UserRole.REPRESENTATIVE, UserRole.BUSINESS_OWNER, UserRole.ADMIN]:
        return True
    
    return False


def can_delete_alert(user: Optional[UserInDB], alert_user_id: str) -> bool:
    """
    Check if user can delete an alert.
    Rules:
    - User can delete their own alerts
    - Moderators and above can delete any alert
    """
    if not user:
        return False
    
    # User can always delete their own content
    if str(user.id) == alert_user_id:
        return True
    
    # Moderators and above can delete any alert
    if user.role in [UserRole.MODERATOR, UserRole.ADMIN]:
        return True
    
    return False


def can_edit_request(user: Optional[UserInDB], request_user_id: str) -> bool:
    """
    Check if user can edit a helpdesk request.
    Rules:
    - User can edit their own requests
    - Trusted users and above can edit any request
    """
    if not user:
        return False
    
    # User can always edit their own content
    if str(user.id) == request_user_id:
        return True
    
    # Trusted users and above can edit any request
    if user.role in [UserRole.TRUSTED_USER, UserRole.MODERATOR, UserRole.REPRESENTATIVE, UserRole.BUSINESS_OWNER, UserRole.ADMIN]:
        return True
    
    return False


def can_delete_request(user: Optional[UserInDB], request_user_id: str) -> bool:
    """
    Check if user can delete a helpdesk request.
    Rules:
    - User can delete their own requests
    - Moderators and above can delete any request
    """
    if not user:
        return False
    
    # User can always delete their own content
    if str(user.id) == request_user_id:
        return True
    
    # Moderators and above can delete any request
    if user.role in [UserRole.MODERATOR, UserRole.ADMIN]:
        return True
    
    return False


def can_edit_response(user: Optional[UserInDB], response_user_id: str) -> bool:
    """
    Check if user can edit a helpdesk response.
    Rules:
    - User can edit their own responses
    - Trusted users and above can edit any response
    """
    if not user:
        return False
    
    # User can always edit their own content
    if str(user.id) == response_user_id:
        return True
    
    # Trusted users and above can edit any response
    if user.role in [UserRole.TRUSTED_USER, UserRole.MODERATOR, UserRole.REPRESENTATIVE, UserRole.BUSINESS_OWNER, UserRole.ADMIN]:
        return True
    
    return False


def can_delete_response(user: Optional[UserInDB], response_user_id: str) -> bool:
    """
    Check if user can delete a helpdesk response.
    Rules:
    - User can delete their own responses
    - Moderators and above can delete any response
    """
    if not user:
        return False
    
    # User can always delete their own content
    if str(user.id) == response_user_id:
        return True
    
    # Moderators and above can delete any response
    if user.role in [UserRole.MODERATOR, UserRole.ADMIN]:
        return True
    
    return False

