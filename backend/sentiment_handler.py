# backend/sentiment_handler.py

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import pipeline
import torch

# VADER for polarity scores
_vader = SentimentIntensityAnalyzer()

# Emotion classification (j-hartmann/emotion-english-distilroberta-base)
_emotion_model = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    return_all_scores=True,
    device=0 if torch.cuda.is_available() else -1
)

def analyze_sentiment(text: str) -> dict:
    """
    Returns a dict with:
      - vader: { label, scores: {neg, neu, pos, compound} }
      - emotions: [ {label, score}, ... ]
    """
    # VADER
    v = _vader.polarity_scores(text)
    if v["compound"] >=  0.05:    vader_label = "positive"
    elif v["compound"] <= -0.05:   vader_label = "negative"
    else:                          vader_label = "neutral"

    # Emotion
    try:
        em = _emotion_model(text)[0]
    except Exception as e:
        print(f"[sentiment_handler] Emotion model error: {e}")
        em = []

    return {
        "vader": {
            "label":  vader_label,
            "scores": v
        },
        "emotions": em
    }
