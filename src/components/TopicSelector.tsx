import React from 'react';
import { TopicOption } from '../types';
import { ChevronRight } from 'lucide-react';

interface TopicSelectorProps {
  options: TopicOption[];
  onSelect: (option: TopicOption) => void;
  onCancel: () => void;
}

export function TopicSelector({ options, onSelect, onCancel }: TopicSelectorProps) {
  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-display font-semibold text-zinc-900 mb-4">Select a Focus Topic</h2>
        <p className="text-zinc-600 font-light text-lg">We identified multiple potential subjects from your input. Which one would you like to deeply analyze?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt)}
            className="group flex flex-col text-left p-6 sm:p-8 bg-white border border-zinc-200 rounded-3xl hover:border-zinc-900 hover:shadow-md transition-all h-full"
          >
            <h3 className="text-lg sm:text-xl font-display font-semibold text-zinc-900 mb-2 sm:mb-4">{opt.title}</h3>
            <p className="text-sm sm:text-base text-zinc-600 font-light flex-grow mb-6 sm:mb-8 leading-relaxed">{opt.summary}</p>
            <div className="mt-auto flex items-center text-sm font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors uppercase tracking-widest">
              Explore Topic <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-16 text-center">
        <button onClick={onCancel} className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors underline-offset-4 hover:underline">
          Cancel and go back
        </button>
      </div>
    </div>
  );
}
