import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import AudioRecorder from "./components/AudioRecorder";
import LanguageSelector from "./components/LanguageSelector";
import EmotionPieChart from "./components/EmotionPieChart";
import "./index.css";
import "./App.css";

// Splash screen with fade-out image
function Splash() {
  return (
    <div className="splash-screen">
      <img
        src={`${process.env.PUBLIC_URL}/splash.png`}
        alt="Schrödinger's Monkeys Splash"
        className="splash-image"
      />
    </div>
  );
}

export default function App() {
  const [fileBlob, setFileBlob] = useState(null);
  const [inputLang, setInputLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [result, setResult] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState([]);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [history, setHistory] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const progressRef = useRef(null);

  // Load available voices for TTS
  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Update background radial origin on mouse move
  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty("--mouse-x", `${x}%`);
    document.documentElement.style.setProperty("--mouse-y", `${y}%`);
  };

  // Simulate a progress bar
  const startProgress = () => {
    setProgress(0);
    setTranslating(true);
    progressRef.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 5 : p));
    }, 300);
  };
  const stopProgress = () => {
    clearInterval(progressRef.current);
    setProgress(100);
    setTimeout(() => {
      setTranslating(false);
      setProgress(0);
    }, 500);
  };

  // Send audio off to the backend and record history
  const submit = async () => {
    if (!fileBlob) {
      alert("Please record or upload audio first.");
      return;
    }
    const form = new FormData();
    form.append("audio", fileBlob, "input.webm");
    form.append("input_lang", inputLang);
    form.append("target_lang", targetLang);

    startProgress();
    try {
      const res = await axios.post("http://127.0.0.1:5000/process", form);
      const data = res.data;
      setResult(data);
      setHistory((h) => [
        ...h,
        {
          timestamp: new Date().toLocaleString(),
          detected: data.detected_lang,
          transcript: data.transcript,
          sentiment: data.sentiment.vader.label,
          emotions: data.sentiment.emotions
            .map((e) => `${e.label}:${(e.score * 100).toFixed(1)}%`)
            .join(", "),
          translation: data.translation,
        },
      ]);
    } catch (err) {
      console.error(err);
      alert("Error processing audio. Check console for details.");
    } finally {
      stopProgress();
    }
  };

  // Play translated text aloud
  const playTranslation = () => {
    if (!result) return;
    const utter = new SpeechSynthesisUtterance(result.translation);
    utter.rate = rate;
    utter.pitch = pitch;
    const match = voices.find((v) =>
      v.lang.toLowerCase().startsWith(targetLang.toLowerCase())
    );
    if (match) {
      utter.voice = match;
      utter.lang = match.lang;
    } else {
      utter.lang = targetLang;
    }
    window.speechSynthesis.speak(utter);
  };

  // Download session history as CSV
  const downloadCSV = () => {
    if (history.length === 0) return;
    const headers = [
      "Timestamp",
      "Detected",
      "Transcript",
      "Sentiment",
      "Emotions",
      "Translation",
    ];
    const rows = history.map((h) => [
      h.timestamp,
      h.detected,
      `"${h.transcript.replace(/"/g, '""')}"`,
      h.sentiment,
      `"${h.emotions}"`,
      `"${h.translation.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translation_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Splash />

      <div className="app-wrapper" onMouseMove={handleMouseMove}>
        <div className="container">
          <header>
            <h1>Voice Translator + Sentiment</h1>
            <p>
              Built for the Philips Ideathon.<br />
              Developed by Shashwat Mukherjee &amp; Swapnanil Bankura.
            </p>
            <p>
              <strong>Use cases:</strong> Tourists exploring a new country,
              visually or hearing challenged users, language learners, global
              teams collaborating.
            </p>
            <button
              className="button-primary"
              onClick={() => setShowAnalytics(true)}
            >
              Analytics
            </button>
          </header>

          <div className="controls">
            <AudioRecorder onRecorded={setFileBlob} />

            <label className="button-primary file-label">
              Choose File
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setFileBlob(e.target.files[0])}
              />
            </label>

            <div className="select-wrapper">
              <label>Input Language</label>
              <LanguageSelector value={inputLang} onChange={setInputLang} />
            </div>

            <div className="select-wrapper">
              <label>Target Language</label>
              <LanguageSelector value={targetLang} onChange={setTargetLang} />
            </div>

            <button
              className="button-primary"
              onClick={submit}
              disabled={translating}
            >
              {translating ? "Translating..." : "Submit"}
            </button>
          </div>

          {translating && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {result && (
            <div className="results">
              <div className="card">
                <h3>Transcript ({result.detected_lang})</h3>
                <p>{result.transcript}</p>
              </div>

              <div className="card">
                <h3>VADER Sentiment</h3>
                <p>
                  {result.sentiment.vader.label} (
                  compound {result.sentiment.vader.scores.compound})
                </p>
              </div>

              <div className="card">
                <h3>Emotional Tone</h3>
                <div className="pie-container">
                  <EmotionPieChart emotions={result.sentiment.emotions} />
                </div>
              </div>

              <div className="card">
                <h3>Translation</h3>
                <p>{result.translation}</p>

                <div className="slider-wrapper">
                  <label>Rate: {rate}</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(+e.target.value)}
                  />
                </div>
                <div className="slider-wrapper">
                  <label>Pitch: {pitch}</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(+e.target.value)}
                  />
                </div>

                <button
                  className="button-primary voice-button"
                  onClick={playTranslation}
                >
                  Play Translation
                </button>
              </div>
            </div>
          )}
        </div>

        {showAnalytics && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="close-button"
                onClick={() => setShowAnalytics(false)}
              >
                &times;
              </button>
              <h2>Translation History</h2>
              <button className="button-primary" onClick={downloadCSV}>
                Download CSV
              </button>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Detected</th>
                    <th>Transcript</th>
                    <th>Sentiment</th>
                    <th>Emotions</th>
                    <th>Translation</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}> 
                      <td>{h.timestamp}</td>
                      <td>{h.detected}</td>
                      <td>{h.transcript}</td>
                      <td>{h.sentiment}</td>
                      <td>{h.emotions}</td>
                      <td>{h.translation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
