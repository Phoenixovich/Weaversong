import PyPDF2
from pdf2image import convert_from_bytes
from PIL import Image
import io
from typing import Tuple, Optional
import google.generativeai as genai
from app.config import settings

# Configure Gemini API
genai.configure(api_key=settings.gemini_api_key)


async def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF file using Gemini Vision OCR
    First tries PyPDF2 for text-based PDFs, then uses Gemini Vision for scanned PDFs
    """
    try:
        # First, try to extract text directly from PDF (for text-based PDFs)
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text.strip():
                text += page_text + "\n"
        
        # If we got text, return it
        if text.strip():
            return text.strip()
        
        # If no text found (scanned PDF), try to convert to images and use Gemini Vision
        try:
            images = convert_from_bytes(pdf_bytes)
        except Exception as poppler_error:
            # If poppler is not installed, we can't convert PDF to images
            # In this case, we'll try to send the first page as-is to Gemini
            # or raise a helpful error message
            error_msg = str(poppler_error)
            if "poppler" in error_msg.lower() or "PATH" in error_msg:
                raise Exception(
                    "Poppler is required for scanned PDF processing. "
                    "Please install poppler-utils:\n"
                    "Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases\n"
                    "Or use: conda install -c conda-forge poppler\n"
                    "Linux: sudo apt-get install poppler-utils\n"
                    "Mac: brew install poppler"
                )
            raise
        
        all_text = []
        
        # Use Gemini Vision model for OCR
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        for i, image in enumerate(images):
            try:
                response = model.generate_content([
                    f"Extract all text from page {i+1} of this PDF document. Preserve the structure and formatting as much as possible. Include all text, numbers, and any visible content.",
                    image
                ])
                if response.text:
                    all_text.append(f"--- Page {i+1} ---\n{response.text.strip()}")
            except Exception as e:
                print(f"Error processing page {i+1}: {str(e)}")
                continue
        
        if all_text:
            return "\n\n".join(all_text)
        else:
            raise Exception("No text could be extracted from the PDF. The PDF might be empty or corrupted.")
            
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

