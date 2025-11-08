import PyPDF2
from pdf2image import convert_from_bytes
from PIL import Image
import io
from typing import Tuple, Optional


async def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF file
    """
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")


async def extract_text_from_image_file(image_bytes: bytes) -> str:
    """
    Extract text from image file using OCR (basic implementation)
    For production, you might want to use Tesseract or Gemini Vision
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # For now, return empty - actual OCR would go here
        # In production, use Gemini Vision API
        return ""
    except Exception as e:
        raise Exception(f"Error processing image: {str(e)}")


def is_pdf_file(filename: str) -> bool:
    """Check if file is a PDF"""
    return filename.lower().endswith('.pdf')


def is_image_file(filename: str) -> bool:
    """Check if file is an image"""
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    return any(filename.lower().endswith(ext) for ext in image_extensions)

