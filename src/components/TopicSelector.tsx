import React, { useState, useEffect } from 'react';
import { TopicOption } from '../types';
import { ChevronRight, Loader2, Sparkles, BookOpen, HelpCircle, CheckCircle2, RotateCcw } from 'lucide-react';

interface TopicSelectorProps {
  options: TopicOption[];
  selectedOption?: TopicOption | null;
  isGenerating?: boolean;
  onSelect: (option: TopicOption) => void;
  onCancel: () => void;
  error?: string | null;
  onRetry?: () => void;
}

export function TopicSelector({ 
  options, 
  selectedOption, 
  isGenerating = false, 
  onSelect, 
  onCancel,
  error,
  onRetry
}: TopicSelectorProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Synthesizing key lecture concepts & formulas...",
    "Drafting executive summary & structured notes...",
    "Building interactive quiz questions & solutions...",
    "Curating targeted reference resources..."
  ];

  useEffect(() => {
    if (!isGenerating) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % steps.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      
      {/* Top Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium tracking-wide uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
          {isGenerating ? "Stage 2: Generating Study Suite" : "Stage 1: Choose Your Direction"}
        </div>
        <h2 className="text-3xl font-display font-semibold text-zinc-900 mb-3">
          {isGenerating ? "Building Your Knowledge Base" : "Select a Focus Topic"}
        </h2>
        <p className="text-zinc-600 font-light text-base sm:text-lg">
          {isGenerating 
            ? `Deeply analyzing "${selectedOption?.title || 'your selected topic'}" to create notes, summaries, and practice quizzes.`
            : "We identified multiple potential subjects from your input. Click one below to generate in-depth notes and quiz materials."}
        </p>
      </div>

      {/* Progress banner while generating */}
      {isGenerating && (
        <div className="mb-10 p-6 bg-white border border-zinc-300 rounded-3xl shadow-sm text-center max-w-2xl mx-auto animate-in fade-in duration-500">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 text-zinc-900 animate-spin" />
            <span className="font-semibold text-zinc-900 text-base">
              {steps[stepIndex]}
            </span>
          </div>

          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden mb-3">
            <div 
              className="bg-zinc-900 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(95, ((stepIndex + 1) / steps.length) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-zinc-400 font-light px-1">
            <span>Concept Extraction</span>
            <span>Notes Compilation</span>
            <span>Practice Quiz</span>
            <span>References</span>
          </div>
        </div>
      )}

      {/* Error Banner if generation failed */}
      {error && (
        <div className="mb-8 p-6 bg-rose-50/70 border border-rose-200 text-rose-900 rounded-3xl max-w-2xl mx-auto text-center shadow-sm">
          <p className="font-semibold text-base mb-1">Content Generation Encountered An Issue</p>
          <p className="text-sm text-rose-700 font-light mb-4">{error}</p>
          <div className="flex items-center justify-center gap-3">
            {onRetry && selectedOption && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retry "{selectedOption.title}"
              </button>
            )}
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-rose-200 text-rose-800 text-sm font-medium rounded-xl hover:bg-rose-100/50 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((opt) => {
          const isThisSelected = selectedOption?.id === opt.id || selectedOption?.title === opt.title;
          const isBusy = isGenerating && isThisSelected;
          const isDisabled = isGenerating && !isThisSelected;

          return (
            <button
              key={opt.id}
              disabled={isGenerating}
              onClick={() => onSelect(opt)}
              className={`group relative flex flex-col text-left p-6 sm:p-8 rounded-3xl transition-all h-full ${
                isThisSelected
                  ? "bg-zinc-50 border-2 border-zinc-900 shadow-md ring-4 ring-zinc-900/5"
                  : isDisabled
                  ? "bg-white/60 border border-zinc-200 opacity-40 cursor-not-allowed"
                  : "bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-md cursor-pointer"
              }`}
            >
              {isThisSelected && isGenerating && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white rounded-full text-xs font-medium shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </div>
              )}

              <h3 className="text-lg sm:text-xl font-display font-semibold text-zinc-900 mb-2 sm:mb-4 pr-16">
                {opt.title}
              </h3>
              
              <p className="text-sm sm:text-base text-zinc-600 font-light flex-grow mb-6 sm:mb-8 leading-relaxed">
                {opt.summary}
              </p>

              <div className="mt-auto flex items-center text-sm font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors uppercase tracking-widest">
                {isBusy ? (
                  <span className="text-zinc-900 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Please wait...
                  </span>
                ) : (
                  <>
                    Explore Topic <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {!isGenerating && (
        <div className="mt-14 text-center">
          <button 
            onClick={onCancel} 
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors underline-offset-4 hover:underline"
          >
            Cancel and choose different input
          </button>
        </div>
      )}
    </div>
  );
}
