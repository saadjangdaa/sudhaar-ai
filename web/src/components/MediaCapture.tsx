"use client";

import { useRef, useState } from "react";

/**
 * Photo picker plus a voice note recorder.
 *
 * MediaRecorder mime types differ per browser (Chrome webm/opus, iOS Safari
 * mp4/m4a), so the real extension is preserved for the upload — the container
 * is what tells Gemini how to decode the audio. Unsupported browsers hide the recorder
 * instead of crashing.
 */
export default function MediaCapture({
  onChange,
}: {
  onChange: (file: File | null, kind: "photo" | "audio" | null) => void;
}) {
  const [preview, setPreview] = useState<{ url: string; kind: "photo" | "audio" } | null>(null);
  const [recording, setRecording] = useState(false);
  // Assumed true so server and client render the same markup; the first click
  // feature-detects and hides the button if the browser cannot record.
  const [canRecord, setCanRecord] = useState(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function attach(file: File, kind: "photo" | "audio") {
    setPreview({ url: URL.createObjectURL(file), kind });
    onChange(file, kind);
  }

  function clear() {
    setPreview(null);
    onChange(null, null);
  }

  async function startRecording() {
    if (typeof window.MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCanRecord(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = recorder.mimeType || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        attach(new File(chunksRef.current, `voice.${ext}`, { type }), "audio");
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setCanRecord(false);
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2">
          📷 Add photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) attach(file, "photo");
            }}
          />
        </label>

        {canRecord &&
          (recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-full bg-red-600 px-4 py-2 text-sm text-white"
            >
              ⏹ Stop recording
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2"
            >
              🎙️ Record voice note
            </button>
          ))}

        {preview && (
          <button
            type="button"
            onClick={clear}
            className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:bg-surface-2"
          >
            Remove
          </button>
        )}
      </div>

      {preview?.kind === "photo" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.url} alt="" className="max-h-56 rounded-lg border border-line object-cover" />
      )}
      {preview?.kind === "audio" && <audio controls src={preview.url} className="w-full" />}
    </div>
  );
}
