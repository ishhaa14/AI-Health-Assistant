from fastapi import HTTPException, status

class AppBaseException(Exception):
    """Base exception for Health Document Assistant errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class AuthException(AppBaseException):
    """Exception for authorization/authentication issues."""
    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)

class NotFoundException(AppBaseException):
    """Exception raised when a requested resource is not found."""
    def __init__(self, resource_name: str, identifier: str = None):
        msg = f"{resource_name} not found."
        if identifier:
            msg = f"{resource_name} with identifier '{identifier}' not found."
        super().__init__(msg, status_code=status.HTTP_404_NOT_FOUND)

class FileProcessingException(AppBaseException):
    """Exception raised during document parsing or OCR errors."""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)
