import React from 'react';
import { BoardAnalysisResult } from '../types';
import { 
  BookOpen, 
  Lightbulb, 
  ClipboardList, 
  GraduationCap, 
  BrainCircuit, 
  PenTool,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { InteractiveQuiz } from './InteractiveQuiz';

interface AnalysisResultsProps {
  data: BoardAnalysisResult;
  imageUrl: string | null;
  inputType: 'image' | 'text' | 'audio';
  textInput: string;
}

export function AnalysisResults({ data, imageUrl, inputType, textInput }: AnalysisResultsProps) {
  const getQualityColor = (quality: string) => {
    const q = quality.toLowerCase();
    if (q.includes('good')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (q.includes('moderate')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 space-y-8">
      
      {/* Header / Image / Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:p-8">
        <div className="lg:col-span-1 space-y-6">
          {inputType === 'image' ? (
            <>
              <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden aspect-video lg:aspect-square relative flex items-center justify-center shadow-sm">
                {imageUrl ? (
                  <img src={imageUrl} alt="Uploaded board" className="w-full h-full object-contain bg-zinc-50/50" />
                ) : (
                  <span className="text-zinc-400 font-light">No image available</span>
                )}
              </div>
              {data.imageQuality && (
                <div className="flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                  <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Image Quality</span>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${getQualityColor(data.imageQuality.quality)}`}>
                    {data.imageQuality.quality} ({data.imageQuality.confidenceScore}%)
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-6 border border-zinc-200 rounded-3xl shadow-sm h-full flex flex-col max-h-[400px] overflow-hidden">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 shrink-0">
                {inputType === 'audio' ? 'Audio Transcription' : 'Text Input'}
              </h3>
              <div className="overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-zinc-700 font-light whitespace-pre-wrap leading-relaxed text-sm">
                  {inputType === 'audio' ? (data.transcription || 'No transcription available.') : textInput}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 border border-zinc-200 rounded-3xl shadow-sm">
            <h2 className="text-2xl font-display font-medium text-zinc-900 mb-5 flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-zinc-400" />
              Lecture Summary
            </h2>
            <p className="text-zinc-600 leading-relaxed font-light text-lg">{data.lectureSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 sm:p-8 border border-zinc-200 rounded-3xl shadow-sm">
              <h2 className="text-xl font-display font-medium text-zinc-900 mb-5 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-zinc-400" />
                Subjects Detected
              </h2>
              <div className="space-y-6">
                {data.subjects.map((sub, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                      <span className="font-semibold text-zinc-800 tracking-tight">{sub.subjectName}</span>
                      <span className="text-xs text-zinc-400 uppercase tracking-widest">{sub.confidence}% confident</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sub.topics.map((t, i) => (
                        <span key={i} className="px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 border border-zinc-200 rounded-3xl shadow-sm">
              <h2 className="text-xl font-display font-medium text-zinc-900 mb-5 flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-zinc-400" />
                Key Concepts
              </h2>
              <ul className="space-y-3">
                {data.keyConcepts.map((concept, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700 text-base font-light">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{concept}</span>
                  </li>
                ))}
              </ul>
              {data.keyConcepts.length === 0 && <p className="text-sm text-zinc-400 font-light">None detected.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:p-8">
        <div className="bg-white p-6 sm:p-8 border border-zinc-200 rounded-3xl shadow-sm space-y-8">
          <h2 className="text-2xl font-display font-medium text-zinc-900 flex items-center gap-3">
            <PenTool className="w-6 h-6 text-zinc-400" />
            Structured Notes
          </h2>
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Executive Summary</h3>
            <p className="text-zinc-700 text-base leading-relaxed font-light bg-zinc-50/50 p-5 rounded-2xl border border-zinc-100">
              {data.generatedNotes.short}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Comprehensive Detail</h3>
            <p className="text-zinc-700 text-base leading-relaxed font-light whitespace-pre-wrap bg-zinc-50/50 p-5 rounded-2xl border border-zinc-100">
              {data.generatedNotes.detailed}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 sm:p-8 border border-zinc-200 rounded-3xl shadow-sm">
            <h2 className="text-2xl font-display font-medium text-zinc-900 mb-6 flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-zinc-400" />
              Knowledge Check
            </h2>
            <InteractiveQuiz questions={data.generatedQuiz} />
          </div>

          {(data.homework.length > 0 || (data.resources && data.resources.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {data.homework.length > 0 && (
                <div className="bg-rose-50/30 p-6 sm:p-8 border border-rose-100 rounded-3xl shadow-sm">
                  <h2 className="text-xl font-display font-medium text-rose-900 mb-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Action Items
                  </h2>
                  <ul className="space-y-3">
                    {data.homework.map((hw, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-rose-800 text-base font-light">
                        <span className="shrink-0 mt-1 opacity-60">•</span>
                        <span className="leading-relaxed">{hw}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.resources && data.resources.length > 0 && (
                <div className="bg-zinc-900 p-6 sm:p-8 border border-zinc-800 rounded-3xl shadow-sm text-zinc-100">
                  <h2 className="text-xl font-display font-medium text-white mb-5 flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-zinc-400" />
                    Deep Dive
                  </h2>
                  <ul className="space-y-5">
                    {data.resources.map((res, idx) => (
                      <li key={idx} className="flex flex-col gap-1.5 group">
                        <a 
                          href={res.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-base font-medium text-zinc-100 hover:text-white flex items-start gap-2 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 shrink-0 mt-1 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                          <span className="underline-offset-4 decoration-zinc-700 hover:underline">{res.title}</span>
                        </a>
                        <span className="text-[10px] text-zinc-400 ml-6 uppercase tracking-widest font-semibold">{res.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
