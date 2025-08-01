import sys, whisper, os, subprocess, warnings
import tempfile

warnings.filterwarnings("ignore")

# check if audio file was provided
if len(sys.argv) < 2:
    print("")
    sys.exit(0)

input_path = sys.argv[1]
if not os.path.isfile(input_path):
    print("") # file doesnt exist
    sys.exit(0)


model = whisper.load_model("base") # Load whisper model

# Create a temp WAV file
converted_path = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name


subprocess.run([ # Convert webm/wav/whatever to 16kHz mono wav
    "ffmpeg", "-y", "-i", input_path,    # <-- this is now fixed
    "-ar", "16000", "-ac", "1",
    "-c:a", "pcm_s16le",
    converted_path
], check=True)

# Transcribe using Whisper
result = model.transcribe(converted_path, fp16=False)
print(result["text"].strip())
