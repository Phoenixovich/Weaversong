# API Keys Setup Guide

This guide explains how to get API keys for AI title generation.

## Google Gemini API Key (Recommended)

1. **Go to Google AI Studio**: https://makersuite.google.com/app/apikey
   - Or visit: https://aistudio.google.com/app/apikey

2. **Sign in** with your Google account

3. **Create API Key**:
   - Click "Create API Key" or "Get API Key"
   - If prompted, create a new Google Cloud project or select an existing one
   - Copy the generated API key

4. **Add to `.env` file**:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   ```

**Note**: With Google AI Pro (2 TB), you should have access to the Gemini API. Make sure you're signed in with the account that has the Pro subscription.

## OpenAI API Key (Optional Fallback)

If you want to use OpenAI as a fallback:

1. **Go to OpenAI Platform**: https://platform.openai.com/api-keys

2. **Sign in** or create an account

3. **Create API Key**:
   - Click "Create new secret key"
   - Give it a name (e.g., "LocalVoice")
   - Copy the key immediately (you won't be able to see it again)

4. **Add to `.env` file**:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Setting Up Your `.env` File

1. **Create a `.env` file** in the `backend` directory (if it doesn't exist)

2. **Copy from `.env.example`**:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env`** and add your API keys:
   ```
   GOOGLE_API_KEY=AIzaSy...your_actual_key_here
   OPENAI_API_KEY=sk-...your_actual_key_here
   ```

4. **Important**: Never commit your `.env` file to git! It should already be in `.gitignore`

## Priority Order

The system will use AI services in this order:
1. **Google Gemini API** (if `GOOGLE_API_KEY` is set) - **Preferred**
2. **OpenAI API** (if `OPENAI_API_KEY` is set) - Fallback
3. **Smart keyword-based generation** - Always available as final fallback

## Testing

After adding your API keys, restart your backend server. The system will automatically:
- Use Google Gemini if the key is available
- Fall back to OpenAI if Google fails
- Use smart keyword-based generation if no AI services are available

You can check the console logs to see which service is being used.

