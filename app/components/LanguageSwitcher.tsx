'use client'

import { type Language } from '../../lib/i18n'

interface Props {
  lang: Language
  setLang: (lang: Language) => void
}

export default function LanguageSwitcher({ lang, setLang }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setLang('kz')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
          lang === 'kz' ? 'bg-emerald-600 text-white' : 'bg-white/20 text-white'
        }`}
      >
        🇰🇿 Қаз
      </button>
      <button
        onClick={() => setLang('ru')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
          lang === 'ru' ? 'bg-emerald-600 text-white' : 'bg-white/20 text-white'
        }`}
      >
        🇷🇺 Рус
      </button>
    </div>
  )
}