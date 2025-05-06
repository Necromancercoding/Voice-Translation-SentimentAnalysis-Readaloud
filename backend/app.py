import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from stt_handler import transcribe_and_detect
from translate_handler import translate_text
from sentiment_handler import analyze_sentiment

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.route("/process", methods=["POST"])
def process_audio():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file"}), 400

        f = request.files["audio"]
        input_lang = request.form.get("input_lang", "auto")
        target_lang = request.form.get("target_lang", "en")

        save_path = os.path.join(UPLOAD_DIR, f.filename)
        f.save(save_path)

        # 1. STT + language detection
        transcript, detected_lang = transcribe_and_detect(save_path, input_lang)

        # 2. Sentiment (on English text)
        text_for_sentiment = transcript
        if detected_lang != "en":
            text_for_sentiment = translate_text(transcript, detected_lang, "en")
        sentiment = analyze_sentiment(text_for_sentiment)

        # 3. Translation to target language
        translation = translate_text(transcript, detected_lang, target_lang)

        return jsonify({
            "transcript": transcript,
            "detected_lang": detected_lang,
            "sentiment": sentiment,
            "translation": translation
        })

    except Exception as e:
        # Print full traceback to your Flask console
        traceback.print_exc()
        # Return error message to client
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Listen on all interfaces so both 127.0.0.1 and ::1 work
    app.run(debug=True, host="0.0.0.0", port=5000)
