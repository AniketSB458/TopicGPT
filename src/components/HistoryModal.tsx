import React from 'react';
import { X, Clock, Trash2 } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryModalProps {
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
}

export function HistoryModal({ onClose, history, onSelect, onClear, onDelete }: HistoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 shrink-0">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-500" />
            Analysis History
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 bg-zinc-50/50">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">No history yet</p>
              <p className="text-zinc-400 text-sm mt-1">Your past analyses will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all cursor-pointer group flex items-start justify-between"
                  onClick={() => onSelect(item)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-md uppercase tracking-wider">
                        {item.inputType}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {new Date(item.date).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-zinc-900 group-hover:text-rose-600 transition-colors">
                      {item.topicTitle}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-2 mt-1">
                      {item.result.lectureSummary}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-4 shrink-0"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-zinc-100 bg-white flex justify-between items-center shrink-0">
            <button
              onClick={onClear}
              className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 transition-colors"
            >
              Clear All History
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl shadow-sm transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
