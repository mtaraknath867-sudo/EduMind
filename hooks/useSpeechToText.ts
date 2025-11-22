import { useState, useEffect, useCallback } from 'react';

export const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onstart = () => setIsListening(true);
        recog.onend = () => setIsListening(false);
        recog.onresult = (event: any) => {
          const transcriptVal = event.results[0][0].transcript;
          setTranscript(transcriptVal);
        };

        setRecognition(recog);
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.error("Speech recognition error", e);
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  return { isListening, transcript, startListening, stopListening, setTranscript };
};