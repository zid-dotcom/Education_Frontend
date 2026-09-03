import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 p-3.5 bg-[#FBBF24] hover:bg-amber-500 text-slate-950 rounded-full shadow-2xl border-2 border-amber-300 transition-all duration-300 hover:scale-110 cursor-pointer active:scale-95 animate-bounce"
    >
      <ArrowUp className="w-5 h-5 font-bold" />
    </button>
  );
};

export default BackToTop;
