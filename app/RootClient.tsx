// app/RootClient.tsx
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './components/BottomNav';

type Language = 'kz' | 'ru';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('ru');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'kz' || savedLang === 'ru')) {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
    // Не перезагружаем страницу, просто обновляем состояние
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

let globalHideBottomNav = false;
export const setGlobalHideBottomNav = (value: boolean) => {
  globalHideBottomNav = value;
};

export default function RootClient({ children }: { children: React.ReactNode }) {
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkHideStatus = () => {
      setHideBottomNav(globalHideBottomNav);
    };
    const interval = setInterval(checkHideStatus, 100);
    
    // Проверка авторизации
    const checkAuth = async () => {
      try {
        const response = await fetch('https://toogood-production.up.railway.app/api/check-auth', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.authenticated && data.user_id) {
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify({
            id: data.user_id,
            name: data.user_name || 'User',
            phone: data.user_phone || ''
          }));
        } else {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        const storedUser = localStorage.getItem('user');
        setIsAuthenticated(!!storedUser);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
    
    return () => clearInterval(interval);
  }, []);

  if (!isClient || !authChecked) {
    return (
      <div className="max-w-md mx-auto relative min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="max-w-md mx-auto relative min-h-screen bg-gray-50">
        {children}
        {!hideBottomNav && <BottomNav />}
      </div>
    </LanguageProvider>
  );
}