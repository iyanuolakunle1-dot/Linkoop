import { useState, useRef, useCallback } from "react";

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error("Microphone access denied or unavailable:", err);
      throw err;
    }
  }, []);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) return resolve(null);

      recorder.onstop = () => {
        clearInterval(timerRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setRecording(false);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
    setSeconds(0);
    chunksRef.current = [];
  }, []);

  return { recording, seconds, start, stop, cancel };
}