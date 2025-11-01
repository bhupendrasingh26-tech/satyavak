import React from 'react';
import { LANGUAGES } from '../constants';

export const LanguageSelector: React.FC<{ selected: string; onSelect: (lang: string) => void }> = ({ selected, onSelect }) => (
  <div className="relative">
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="bg-slate-100 dark:bg-slate-700 text-brand-dark dark:text-slate-200 py-2 pl-3 pr-8 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-brand-accent cursor-pointer"
      aria-label="Select language"
    >
      {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  </div>
);