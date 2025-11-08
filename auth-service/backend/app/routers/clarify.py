from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from app.services.gemini_service import simplify_text, simplify_legal_text, extract_text_from_image
from app.utils.file_processing import extract_text_from_pdf, is_pdf_file, is_image_file
from typing import Optional

router = APIRouter(prefix="/clarify", tags=["clarify"])


@router.post("/simplify")
async def simplify(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    model: Optional[str] = Form('gemini-2.5-flash'),
    style: Optional[str] = Form('default')
):
    """
    Simplify complex medical text or documents into plain language.
    Accepts either text input or file upload (PDF/image).
    """
    try:
        # Get text from either form input or file
        input_text = ""
        
        if file:
            # Process uploaded file
            file_bytes = await file.read()
            
            if not file.filename:
                raise HTTPException(
                    status_code=400,
                    detail="File must have a filename."
                )
            
            if is_pdf_file(file.filename):
                input_text = await extract_text_from_pdf(file_bytes)
            elif is_image_file(file.filename):
                # Use Gemini Vision to extract text
                input_text = await extract_text_from_image(file_bytes)
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported file type. Please upload PDF or image file."
                )
        elif text:
            input_text = text
        else:
            raise HTTPException(
                status_code=400,
                detail="Please provide either text or file input."
            )
        
        if not input_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text found in input. Please check your file or text."
            )
        
        # Simplify the text
        simplified = await simplify_text(input_text, model or 'gemini-2.5-flash', style or 'default')
        
        return {
            "simplified": simplified
        }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = str(e)
        print(f"Error in simplify endpoint: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {error_detail}"
        )


@router.post("/legal")
async def legal(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    model: Optional[str] = Form('gemini-2.5-flash'),
    style: Optional[str] = Form('default')
):
    """
    Simplify complex legal documents into plain language.
    Accepts either text input or file upload (PDF/image).
    """
    try:
        # Get text from either form input or file
        input_text = ""
        
        if file:
            # Process uploaded file
            file_bytes = await file.read()
            
            if not file.filename:
                raise HTTPException(
                    status_code=400,
                    detail="File must have a filename."
                )
            
            if is_pdf_file(file.filename):
                input_text = await extract_text_from_pdf(file_bytes)
            elif is_image_file(file.filename):
                # Use Gemini Vision to extract text
                input_text = await extract_text_from_image(file_bytes)
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported file type. Please upload PDF or image file."
                )
        elif text:
            input_text = text
        else:
            raise HTTPException(
                status_code=400,
                detail="Please provide either text or file input."
            )
        
        if not input_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text found in input. Please check your file or text."
            )
        
        # Simplify the legal text
        simplified = await simplify_legal_text(input_text, model or 'gemini-2.5-flash', style or 'default')
        
        return {
            "simplified": simplified
        }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = str(e)
        print(f"Error in legal endpoint: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {error_detail}"
        )

