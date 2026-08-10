import React from 'react';
import { X, Github, Linkedin, Mail } from 'lucide-react';

export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center space-y-4 mb-8">
          <div className="w-20 h-20 bg-zinc-900 rounded-full mx-auto flex items-center justify-center mb-4 shadow-inner">
            <span className="text-2xl font-display font-semibold text-white">AB</span>
          </div>
          <h2 className="text-2xl font-display font-semibold text-zinc-900">Aniket S. Bandgar</h2>
          <p className="text-zinc-500 text-sm font-light leading-relaxed">
            Developer of TopicGPT. Passionate about building AI-powered tools to make everything more accessible and structured.
          </p>
        </div>

        <div className="space-y-3">
          <a 
            href="https://github.com/AniketSB458" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all group"
          >
            <Github className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900" />
            <span className="font-medium text-zinc-700 group-hover:text-zinc-900">GitHub Profile</span>
          </a>
          <a 
            href="https://www.linkedin.com/in/aniket-bandgar-47800532a" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
          >
            <Linkedin className="w-5 h-5 text-zinc-600 group-hover:text-blue-600" />
            <span className="font-medium text-zinc-700 group-hover:text-blue-600">LinkedIn Profile</span>
          </a>
          <a 
            href="mailto:anyabandgar458@gmail.com" 
            className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 hover:border-rose-600 hover:bg-rose-50 transition-all group"
          >
            <Mail className="w-5 h-5 text-zinc-600 group-hover:text-rose-600" />
            <span className="font-medium text-zinc-700 group-hover:text-rose-600">Contact via Email</span>
          </a>
        </div>
      </div>
    </div>
  );
}
