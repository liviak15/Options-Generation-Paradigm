import React, { useEffect, useState, useCallback, useRef } from "react";
import { fetchResponses, submitScore } from "./api";

export default function App() {
  // app state for form and recording
  const [data, setData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [athleteId, setAthleteId] = useState("");
  const [recordingId, setRecordingId] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const recordedChunksRef = useRef([]);

  const load = useCallback(() => { // load all saved respnses
    fetchResponses().then((r) => setData(r.data));
  }, []);
  useEffect(load, [load]);

  const handleScore = (id, score) => // save expert score
    submitScore(id, score).then(load);

  const handleUpload = async (e) => { //handle file uploads
    e.preventDefault();
    setUploading(true);
    setUploadSuccess(false);

    const res = await fetch("http://localhost:4000/api/upload", {
      method: "POST",
      body: new FormData(e.target),
    });

    setUploading(false);
    if (!res.ok) return alert("Upload failed");

    setUploadSuccess(true);
    e.target.reset();
    load();
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleDelete = async (id) => { // delete a response row
    if (!confirm("Are you sure you want to delete this entry?")) return;
    const res = await fetch(`http://localhost:4000/api/responses/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return alert("Delete failed");
    load();
  };

  const startRecording = async () => { // recoridn with mic
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mimeType = "audio/webm"; // Force consistent MIME type
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      alert("WebM recording is not supported in your browser.");
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    recordedChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => { // after stopping, send audio to backend
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const formData = new FormData();
      formData.append("athleteId", athleteId);
      formData.append("videoId", recordingId);
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("http://localhost:4000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadSuccess(true);
        load();
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        alert("Recording upload failed");
      }
    };

    recorder.start();
    setMediaRecorder(recorder);
  };

  const stopRecording = () => { // stop recording
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  return (
    <div className="min-h-screen bg-cloud font-sans p-8">
      <h1 className="text-4xl font-bold uppercase mb-10 text-center">
        Expert Scoring Panel
      </h1>

      {uploading && (
        <p className="text-black mb-4 text-center">
          Uploading&nbsp;&amp;&nbsp;Transcribing…
        </p>
      )}

      {uploadSuccess && (
        <p className="text-green-600 font-semibold text-center mb-4">
          <span className="text-xl">✔</span> Upload successful!
        </p>
      )}

      
      <div className="flex flex-col md:flex-row justify-center gap-12 mb-12">
    
        <form
          onSubmit={handleUpload}
          className="flex flex-col items-center gap-4 bg-white shadow-md p-6 rounded w-full max-w-sm"
        >
          <input
            name="athleteId"
            placeholder="Athlete ID"
            required
            className="border p-2 rounded w-full"
          />
          <input
            name="videoId"
            placeholder="Recording ID"
            required
            className="border p-2 rounded w-full"
          />

          <label className="bg-veryperi text-white px-4 py-2 rounded cursor-pointer hover:brightness-110 text-center w-full">
            Choose Audio File
            <input
              type="file"
              name="audio"
              accept="audio/*"
              required
              className="hidden"
            />
          </label>

          <button
            type="submit"
            className="bg-veryperi text-white px-6 py-2 rounded hover:brightness-110 w-full"
          >
            Upload & Transcribe
          </button>
        </form>

        {/* Microphone Recording */}
        <div className="flex flex-col items-center gap-4 bg-white shadow-md p-6 rounded w-full max-w-sm">
          <input
            type="text"
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            placeholder="Athlete ID"
            required
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            value={recordingId}
            onChange={(e) => setRecordingId(e.target.value)}
            placeholder="Recording ID"
            required
            className="border p-2 rounded w-full"
          />
          <button
            type="button"
            onClick={startRecording}
            className="bg-veryperi text-white px-6 py-2 rounded hover:brightness-110 w-full"
          >
            🎤 Start Recording
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="bg-veryperi text-white px-6 py-2 rounded hover:brightness-110 w-full"
          >
            ⏹ Stop & Upload
          </button>
        </div>
      </div>

      {/* ── Responses table ───────────────────────── */}
      {data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">Athlete</th>
                <th className="p-2 border">Recording</th>
                <th className="p-2 border">Transcript</th>
                <th className="p-2 border">Auto-Score</th>
                <th className="p-2 border">Expert Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r._id} className="bg-white">
                  <td className="p-2 border">{r.athleteId}</td>
                  <td className="p-2 border">{r.videoId}</td>
                  <td className="p-2 border whitespace-pre-wrap max-w-md">
                    {r.transcript}
                  </td>
                  <td className="p-2 border text-center">
                    {r.autoScore ?? "-"}
                  </td>
                  <td className="p-2 border text-center flex flex-col items-center gap-2">
                    {r.expertScore ?? (
                      <ScoreInput row={r} onSave={handleScore} />
                    )}
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete Row
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScoreInput({ row, onSave }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-2 justify-center">
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-16 border rounded p-1 text-center"
      />
      <button
        onClick={() => onSave(row._id, Number(val))}
        className="bg-veryperi text-white px-3 py-1 rounded hover:brightness-110"
      >
        Save
      </button>
    </div>
  );
}
