# backend/translate_handler.py

from deep_translator import GoogleTranslator

def translate_text(text: str, src_lang: str, tgt_lang: str) -> str:
    """
    Translate `text` from src_lang into tgt_lang using deep-translator’s
    GoogleTranslator (scrapes Google Translate under the hood).
    Returns the translated text, or the original on any error.
    """
    try:
        # deep-translator accepts 'auto' for autodetection
        source = src_lang if src_lang and src_lang != "auto" else "auto"
        translator = GoogleTranslator(source=source, target=tgt_lang)
        translated = translator.translate(text)
        return translated
    except Exception as e:
        print(f"[translate_handler] deep_translator error: {e}")
        # Fallback – just return the input unchanged
        return text
