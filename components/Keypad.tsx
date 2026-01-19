
import React from 'react';

interface KeypadProps {
  onInput: (value: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onSubmit: () => void;
  maxDigits?: number;
  currentValue: string;
  submitLabel?: string;
  title?: string;
}

const Keypad: React.FC<KeypadProps> = ({
  onInput,
  onClear,
  onDelete,
  onSubmit,
  maxDigits = 6,
  currentValue,
  submitLabel = "Submit",
  title
}) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'ENT'];

  const handleClick = (digit: string) => {
    if (digit === 'CLR') {
      onClear();
    } else if (digit === 'ENT') {
      if (currentValue.length > 0) onSubmit();
    } else {
      if (currentValue.length < maxDigits) {
        onInput(digit);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm mx-auto">
      {title && <h2 className="text-xl font-bold mb-6 text-slate-700">{title}</h2>}
      
      <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-4 px-6 mb-8 flex items-center relative group">
        <div className="flex-1 text-center text-3xl font-mono tracking-[0.5em] text-slate-800">
          {currentValue || <span className="text-slate-300">----</span>}
        </div>
        {currentValue.length > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
            title="Backspace"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414A2 2 0 0010.828 19H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {digits.map((digit) => (
          <button
            key={digit}
            onClick={() => handleClick(digit)}
            className={`
              h-16 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center
              ${digit === 'CLR' 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : digit === 'ENT'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}
            `}
          >
            {digit}
          </button>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={currentValue.length === 0}
        className="w-full mt-6 h-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-100 uppercase tracking-wide"
      >
        {submitLabel}
      </button>
    </div>
  );
};

export default Keypad;
