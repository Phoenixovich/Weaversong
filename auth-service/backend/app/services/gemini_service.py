import google.generativeai as genai
from app.config import settings
from typing import Optional
import base64
from PIL import Image
import io

# Configure Gemini API
genai.configure(api_key=settings.gemini_api_key)


async def simplify_text(text: str, model_name: str = 'gemini-2.5-flash', style: str = 'default') -> str:
    """
    Simplify complex medical text into plain language
    """
    model = genai.GenerativeModel(model_name)
    
    # Different prompts based on style
    if style == 'shorter':
        prompt = f"""You are a medical clarity assistant. Rewrite the following medical or discharge instructions in clear, everyday language that anyone can understand. Make it SHORTER and more concise than the original.

Start your answer right away with no intro.

For each condition, organize the response into:

1. **Overview** (brief summary)

2. **Medications** (names, purpose, how and when to take - keep it short)

3. **Suggested Daily Habits** (key points only)

4. **Warning Signs** (when to call the doctor or go to the hospital)

Keep sentences VERY short. Use simple wording and bulleted steps. Be concise - remove unnecessary details.

Use markdown format

Instructions:

{text}"""
    elif style == 'explain like im 5':
        prompt = f"""You are a medical clarity assistant. Explain the following medical or discharge instructions like you're talking to a 5-year-old. Use VERY simple words, short sentences, and examples kids would understand.

Start your answer right away with no intro.

For each condition, organize the response into:

1. **What's Going On** (explain like talking to a child)

2. **Your Medicine** (what each medicine does, in simple terms)

3. **What to Do Every Day** (simple daily tasks)

4. **When to Get Help** (when something is wrong and you need a doctor)

Use VERY simple words. No medical jargon. Use examples and comparisons a child would understand. Keep sentences super short.

Use markdown format

Instructions:

{text}"""
    else:  # default
        prompt = f"""You are a medical clarity assistant. Rewrite the following medical or discharge instructions in clear, everyday language that anyone can understand. 

Start your answer right away with no intro.

For each condition, organize the response into:

1. **Overview**

2. **Medications** (names, purpose, how and when to take)

3. **Suggested Daily Habits**

4. **Warning Signs (When to Call the Doctor or Go to the Hospital)**

Keep sentences short and clear. Use simple wording and numbered or bulleted steps.

Use markdown format

Instructions:

{text}"""
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        raise Exception(f"Error simplifying text: {str(e)}")


async def simplify_legal_text(text: str, model_name: str = 'gemini-2.5-flash', style: str = 'default') -> str:
    """
    Simplify complex legal documents into plain language
    """
    model = genai.GenerativeModel(model_name)
    
    # Different prompts based on style
    if style == 'shorter':
        prompt = f"""You are a legal clarity assistant. Rewrite the following legal document or contract in clear, everyday language that anyone can understand without needing a lawyer. Make it SHORTER and more concise than the original.

Start your answer right away with no intro.

Organize the response into:

1. **Overview** (brief summary of what this document is about)

2. **Key Points** (main things you need to know - keep it short)

3. **Your Rights** (what you're entitled to - brief)

4. **Your Responsibilities** (what you need to do - brief)

5. **Important Dates** (key deadlines only)

6. **What to Watch Out For** (main concerns only)

Keep sentences VERY short. Use simple wording and bulleted steps. Avoid legal jargon. Be concise - remove unnecessary details.

Use markdown format

Legal Document:

{text}"""
    elif style == 'explain like im 5':
        prompt = f"""You are a legal clarity assistant. Explain the following legal document or contract like you're talking to a 5-year-old. Use VERY simple words, short sentences, and examples kids would understand.

Start your answer right away with no intro.

Organize the response into:

1. **What This Paper Says** (explain like talking to a child)

2. **Important Things to Know** (main points in simple terms)

3. **What You Can Do** (your rights explained simply)

4. **What You Need to Do** (your responsibilities in simple terms)

5. **Important Dates** (when things need to happen)

6. **Things to Be Careful About** (potential problems explained simply)

Use VERY simple words. No legal jargon. Use examples and comparisons a child would understand. Keep sentences super short.

Use markdown format

Legal Document:

{text}"""
    else:  # default
        prompt = f"""You are a legal clarity assistant. Rewrite the following legal document or contract in clear, everyday language that anyone can understand without needing a lawyer.

Start your answer right away with no intro.

Organize the response into:

1. **Overview** (What this document is about)

2. **Key Points** (Main things you need to know)

3. **Your Rights** (What you're entitled to)

4. **Your Responsibilities** (What you need to do)

5. **Important Dates and Deadlines**

6. **What to Watch Out For** (Potential issues or concerns)

Keep sentences short and clear. Use simple wording and numbered or bulleted steps. Avoid legal jargon.

Use markdown format

Legal Document:

{text}"""
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        raise Exception(f"Error simplifying legal text: {str(e)}")


async def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extract text from image using Gemini Vision
    """
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Use Gemini Vision model (gemini-1.5-pro supports vision)
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content([
            "Extract all text from this image. Preserve the structure and formatting as much as possible.",
            image
        ])
        
        return response.text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from image: {str(e)}")


async def process_document(text: str, operation: str = "simplify") -> str:
    """
    Process document text - either simplify medical or legal
    """
    if operation == "simplify" or operation == "medical":
        return await simplify_text(text)
    elif operation == "legal":
        return await simplify_legal_text(text)
    else:
        raise ValueError(f"Unknown operation: {operation}")

