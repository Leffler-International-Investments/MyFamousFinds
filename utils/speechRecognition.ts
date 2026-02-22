// FILE: /utils/speechRecognition.ts
// Cross-platform speech recognition: uses Capacitor native plugin on iOS/Android,
// falls back to Web Speech API on desktop browsers.

import { Capacitor } from "@capacitor/core";

type SpeechCallbacks = {
  onStart: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd: (finalTranscript: string) => void;
  onError: (message: string) => void;
};

let activeWebRecognition: any = null;

/**
 * Check if any form of speech recognition is available.
 */
export function isSpeechAvailable(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof window === "undefined") return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Start speech recognition. Returns a stop function.
 */
export async function startSpeechRecognition(
  callbacks: SpeechCallbacks
): Promise<() => void> {
  if (Capacitor.isNativePlatform()) {
    return startNativeSpeech(callbacks);
  }
  return startWebSpeech(callbacks);
}

/* ── Native Capacitor speech recognition ── */

async function startNativeSpeech(
  callbacks: SpeechCallbacks
): Promise<() => void> {
  try {
    const { SpeechRecognition } = await import(
      "@capacitor-community/speech-recognition"
    );

    // Request permission first
    const permResult = await SpeechRecognition.requestPermissions();
    if (
      permResult.speechRecognition !== "granted"
    ) {
      callbacks.onError(
        "Microphone permission is needed for voice input."
      );
      return () => {};
    }

    let fullTranscript = "";

    callbacks.onStart();

    await SpeechRecognition.start({
      language: "en-US",
      partialResults: true,
      popup: false,
    });

    // Listen for partial results
    const listener = await SpeechRecognition.addListener(
      "partialResults",
      (data: any) => {
        if (data.matches && data.matches.length > 0) {
          fullTranscript = data.matches[0];
          callbacks.onResult(fullTranscript, false);
        }
      }
    );

    // Return stop function
    return async () => {
      try {
        await SpeechRecognition.stop();
      } catch {
        // ignore
      }
      if (listener && listener.remove) listener.remove();
      callbacks.onEnd(fullTranscript);
    };
  } catch (err: any) {
    console.error("Native speech recognition failed:", err);
    callbacks.onError("Voice input is not available on this device.");
    return () => {};
  }
}

/* ── Web Speech API fallback ── */

function startWebSpeech(callbacks: SpeechCallbacks): Promise<() => void> {
  return new Promise((resolve) => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      callbacks.onError(
        "Voice is not supported in this browser. Please try Chrome, Edge, or Safari."
      );
      resolve(() => {});
      return;
    }

    const rec = new SpeechRecognitionClass();
    activeWebRecognition = rec;

    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;

    let finalTranscript = "";

    rec.onstart = () => {
      callbacks.onStart();
    };

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      finalTranscript = final || interim;
      callbacks.onResult(finalTranscript, !!final);
    };

    rec.onend = () => {
      activeWebRecognition = null;
      callbacks.onEnd(finalTranscript);
    };

    rec.onerror = (event: any) => {
      activeWebRecognition = null;
      const err = event.error || "unknown";
      if (err === "not-allowed" || err === "permission-denied") {
        callbacks.onError(
          "Microphone blocked. Please allow microphone access in your browser settings."
        );
      } else if (err === "no-speech") {
        // silent reset — user just didn't speak
        callbacks.onEnd("");
      } else if (err === "network") {
        callbacks.onError(
          "Voice requires an internet connection. Please check your network."
        );
      } else if (err !== "aborted") {
        callbacks.onError("Voice input failed. Please try again.");
      }
    };

    // Start — browser will show permission dialog if needed
    try {
      rec.start();
    } catch {
      callbacks.onError("Could not start voice input. Please try again.");
    }

    // Return stop function
    resolve(() => {
      try {
        rec.stop();
      } catch {
        // ignore
      }
      activeWebRecognition = null;
    });
  });
}

/**
 * Stop any active speech recognition.
 */
export function stopSpeechRecognition() {
  if (activeWebRecognition) {
    try {
      activeWebRecognition.stop();
    } catch {
      // ignore
    }
    activeWebRecognition = null;
  }
}
