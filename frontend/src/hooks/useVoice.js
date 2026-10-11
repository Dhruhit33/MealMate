import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Tiny wrapper over the browser's Web Speech APIs.
 *
 * Speech-to-text: SpeechRecognition (Chrome/Edge/Safari, NOT Firefox).
 * Text-to-speech: SpeechSynthesis (everywhere).
 *
 * Returns:
 *   supported          — true if SpeechRecognition exists
 *   listening          — true while the mic is hot
 *   speaking           — true while TTS is playing
 *   transcript         — most recent finalized text from the mic
 *   interim            — live partial transcript (good for showing as you speak)
 *   start()            — begin listening
 *   stop()             — stop listening
 *   speak(text, opts)  — speak a string; opts = { onEnd: () => {} }
 *   cancelSpeech()     — interrupt TTS
 */
export function useVoice({ lang = "en-US" } = {}) {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");

  // Track the most recent intentional state so the recognition.onend handler
  // knows whether to fire `listening = false` or whether we just want to
  // restart (recognition stops itself after a long silence).
  const wantListening = useRef(false);

  // ── Initialize SpeechRecognition once ──────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const r = new SR();
    r.lang = lang;
    r.continuous = false;          // single utterance per session — easier to reason about
    r.interimResults = true;       // show partial text as the user speaks
    r.maxAlternatives = 1;

    r.onstart = () => setListening(true);

    r.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i];
        if (chunk.isFinal) finalText += chunk[0].transcript;
        else                interimText += chunk[0].transcript;
      }
      if (finalText) {
        setTranscript((prev) => (prev + " " + finalText).trim());
        setInterim("");
      } else {
        setInterim(interimText);
      }
    };

    r.onerror = (e) => {
      // 'no-speech' fires after a few seconds of silence — not a real error.
      // 'aborted' fires when we stop() ourselves — not a real error.
      if (e.error !== "no-speech" && e.error !== "aborted") {
        console.warn("Speech recognition error:", e.error);
      }
      setListening(false);
    };

    r.onend = () => {
      setListening(false);
      setInterim("");
      // If the user wanted to keep listening but recognition timed out,
      // the parent's logic decides whether to restart — we don't auto-restart
      // here to avoid loops on errors.
    };

    recognitionRef.current = r;

    return () => {
      try { r.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    // If TTS is mid-sentence, kill it first so we don't capture our own voice.
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
    setTranscript("");
    setInterim("");
    wantListening.current = true;
    try {
      r.start();
    } catch (e) {
      // start() throws if already started — ignore.
    }
  }, []);

  const stop = useCallback(() => {
    wantListening.current = false;
    const r = recognitionRef.current;
    if (r) try { r.stop(); } catch {}
  }, []);

  // ── Text-to-speech ─────────────────────────────────────────────────
  const speak = useCallback((text, { onEnd } = {}) => {
    if (!text || !window.speechSynthesis) {
      onEnd?.();
      return;
    }
    // Cancel anything currently speaking
    window.speechSynthesis.cancel();

    // Strip stuff that sounds bad when read aloud (markdown, code fences, etc.)
    const cleaned = text
      .replace(/```[\s\S]*?```/g, "")        // code blocks
      .replace(/`([^`]+)`/g, "$1")            // inline code
      .replace(/\*\*?([^*]+)\*\*?/g, "$1")    // bold/italic
      .replace(/_([^_]+)_/g, "$1")            // underscores
      .replace(/[•·]/g, ",")                  // bullets → commas
      .replace(/#{1,6}\s+/g, "")              // headers
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      onEnd?.();
      return;
    }

    const utter = new SpeechSynthesisUtterance(cleaned);
    utter.lang = lang;
    utter.rate = 1.05;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    // Try to pick a pleasant-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith(lang.slice(0, 2)) &&
             /female|samantha|google|natural/i.test(v.name)
    ) || voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
    if (preferred) utter.voice = preferred;

    utter.onstart = () => setSpeaking(true);
    utter.onend   = () => { setSpeaking(false); onEnd?.(); };
    utter.onerror = () => { setSpeaking(false); onEnd?.(); };

    window.speechSynthesis.speak(utter);
  }, [lang]);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return {
    supported,
    listening,
    speaking,
    transcript,
    interim,
    start,
    stop,
    speak,
    cancelSpeech,
  };
}
