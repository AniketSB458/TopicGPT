import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud, Camera, Mic, Square, Loader2, Send } from 'lucide-react';

interface InputTabsProps {
  onSubmit: (inputType: 'image' | 'text' | 'audio', file: File | null, text: string) => void;
  isLoading: boolean;
  freeSearchesRemaining?: number | null;
}

export function InputTabs({ onSubmit, isLoading, freeSearchesRemaining }: InputTabsProps) {
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onSubmit('image', e.dataTransfer.files[0], '');
    }
  }, [onSubmit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onSubmit('image', e.target.files[0], '');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Microphone access denied or not available. Please allow permissions in your browser.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    
    // Stop all audio tracks to release the microphone
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  };

  const handleAudioSubmit = () => {
    if (audioBlob) {
      const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      onSubmit('audio', file, '');
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onSubmit('text', null, textInput);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
      {isLoading ? (
        <div className="border border-zinc-200 rounded-3xl p-16 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-6 shadow-sm"> 
          <Loader2 className="w-10 h-10 text-zinc-900 animate-spin" /> 
          <div>
            <h3 className="text-xl font-display font-medium text-zinc-900">
              Analyzing Knowledge...
            </h3>
            <p className="text-base text-zinc-500 mt-2 font-light">
              Processing your input to extract topics and structure notes.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-200 p-4 sm:p-8 shadow-sm space-y-6 sm:space-y-8">
          
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div
              className={`group relative border border-dashed rounded-2xl sm:rounded-3xl p-4 sm:p-10 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer ${
                isDragging ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-300 hover:border-zinc-900 bg-white hover:bg-zinc-50 hover:shadow-sm'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" ref={fileInputRef} />
              <div className="bg-zinc-100 p-3 sm:p-5 rounded-xl sm:rounded-2xl mb-2 sm:mb-5 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="w-5 h-5 sm:w-8 sm:h-8 text-zinc-900" />
              </div>
              <h3 className="text-sm sm:text-lg font-medium text-zinc-900 font-display">Upload Image</h3>
              <p className="text-[10px] sm:text-sm text-zinc-500 mt-1 sm:mt-2 mb-1 sm:mb-6 font-light">Browse files or drag & drop</p>
            </div>
            <div
              className="group border border-dashed border-zinc-300 hover:border-zinc-900 hover:bg-zinc-50 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-10 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-sm"
              onClick={() => cameraInputRef.current?.click()}
            >
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" ref={cameraInputRef} />
              <div className="bg-zinc-100 p-3 sm:p-5 rounded-xl sm:rounded-2xl mb-2 sm:mb-5 group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-5 h-5 sm:w-8 sm:h-8 text-zinc-900" />
              </div>
              <h3 className="text-sm sm:text-lg font-medium text-zinc-900 font-display">Take a Photo</h3>
              <p className="text-[10px] sm:text-sm text-zinc-500 mt-1 sm:mt-2 mb-1 sm:mb-6 font-light">Use your device camera</p>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextSubmit();
              }}
              placeholder="Or type notes, or click mic to transcribe..."
              className="w-full pl-6 pr-28 py-4 rounded-full border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all font-light text-zinc-700 bg-zinc-50/50"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {!isRecording ? (
                <button 
                  onClick={startRecording}
                  className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 rounded-full transition-colors"
                  title="Start Recording"
                >
                  <Mic className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={stopRecording}
                  className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-full animate-pulse transition-colors"
                  title="Stop Recording"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              )}
              <button 
                onClick={handleTextSubmit}
                disabled={!textInput.trim()}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-full transition-colors ml-1"
                title="Send text"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {audioBlob && !isRecording && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-full max-w-sm h-10" />
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setAudioBlob(null)}
                  className="px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-full transition-colors shadow-sm whitespace-nowrap"
                >
                  Discard
                </button>
                <button 
                  onClick={handleAudioSubmit}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-full transition-colors shadow-sm whitespace-nowrap"
                >
                  Analyze Audio
                </button>
              </div>
            </div>
          )}

          {freeSearchesRemaining !== undefined && freeSearchesRemaining !== null && (
            <div className="flex justify-center items-center mt-4 text-xs font-medium text-zinc-500">
              <span className={`px-2.5 py-1 rounded-full ${freeSearchesRemaining > 0 ? 'bg-zinc-100' : 'bg-rose-100 text-rose-700'}`}>
                {freeSearchesRemaining} free {freeSearchesRemaining === 1 ? 'search' : 'searches'} remaining
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
