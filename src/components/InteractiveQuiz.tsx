import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle2, XCircle } from 'lucide-react';

export function InteractiveQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (qIdx: number, option: string) => {
    if (showResults) return; // Prevent changing answer after submission
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const score = Object.entries(selectedAnswers).reduce((acc, [idx, ans]) => {
    return acc + (ans === questions[Number(idx)].answer ? 1 : 0);
  }, 0);

  if (!questions || questions.length === 0) {
    return <p className="text-sm text-slate-400">No quiz generated.</p>;
  }

  return (
    <div className="space-y-8">
      {questions.map((q, idx) => {
        const isCorrect = selectedAnswers[idx] === q.answer;
        const hasAnswered = selectedAnswers[idx] !== undefined;

        return (
          <div key={idx} className="space-y-4">
            <div className="flex gap-3">
              <span className="font-display text-zinc-400 font-medium">{idx + 1}.</span>
              <p className="font-medium text-zinc-800 text-lg">{q.question}</p>
            </div>
            <div className="pl-7">
              {q.options && q.options.length > 0 ? (
                <ul className="space-y-3 mb-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[idx] === opt;
                    const isOptionCorrect = opt === q.answer;
                    
                    let optionClass = "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50";
                    if (showResults) {
                      if (isOptionCorrect) {
                        optionClass = "border-emerald-500 bg-emerald-50/50 text-emerald-900";
                      } else if (isSelected && !isOptionCorrect) {
                        optionClass = "border-rose-500 bg-rose-50/50 text-rose-900";
                      } else {
                        optionClass = "border-zinc-100 opacity-50";
                      }
                    } else if (isSelected) {
                      optionClass = "border-zinc-900 bg-zinc-900 text-white shadow-sm";
                    }

                    return (
                      <li key={oIdx}>
                        <button
                          onClick={() => handleSelect(idx, opt)}
                          disabled={showResults}
                          className={`w-full text-left px-5 py-3 text-base rounded-xl border transition-all flex items-center justify-between ${optionClass}`}
                        >
                          <span className={isSelected && !showResults ? "font-medium" : ""}>{opt}</span>
                          {showResults && isOptionCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                          {showResults && isSelected && !isOptionCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-zinc-500 italic">No options provided for this question. Answer: {q.answer}</div>
              )}
              
              {showResults && hasAnswered && !isCorrect && q.options && q.options.length > 0 && (
                <div className="mt-3 text-sm bg-zinc-50 text-zinc-700 px-4 py-3 rounded-xl border border-zinc-200 inline-block">
                  <span className="font-semibold text-zinc-900">Correct Answer:</span> {q.answer}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {!showResults ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(selectedAnswers).length === 0}
          className="mt-6 px-8 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 text-white font-medium rounded-xl transition-colors w-full sm:w-auto shadow-sm"
        >
          Submit Answers
        </button>
      ) : (
        <div className="mt-8 p-6 sm:p-8 bg-zinc-50 rounded-2xl text-center border border-zinc-100">
          <p className="text-2xl font-display font-medium text-zinc-900 mb-2">
            Your Score: {score} / {questions.length}
          </p>
          <p className="text-zinc-500 mb-6 font-light">
            {score === questions.length ? 'Perfect! You mastered this topic.' : 'Keep reviewing the material and try again.'}
          </p>
          <button
            onClick={() => {
              setSelectedAnswers({});
              setShowResults(false);
            }}
            className="px-6 py-2.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-sm font-medium rounded-xl transition-all shadow-sm"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
}
