import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Clock, Mic, MicOff, Zap, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store';
import { products } from '@/data';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const POPULAR_SEARCHES = [
  'Nike Air Force 1',
  'Zara Midi Dress',
  "Levi's 511 Jeans",
  'Gucci Tote Bag',
  'Adidas Ultraboost',
  'Chanel No.5',
];

const TRENDING_TAGS = [
  'Oversized Tees',
  'Midi Dresses',
  'Chunky Sneakers',
  'Mini Bags',
  'Wide Leg Pants',
  'Linen Blazer',
  'Platform Shoes',
];

const STORAGE_KEY = 'quickky-recent-searches';
const MAX_RECENT = 8;

// ─── Typo Correction ──────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findBestMatch(query: string): string | null {
  const q = query.toLowerCase().trim();
  if (q.length < 3) return null;
  const candidates = [
    ...products.map(p => p.name.toLowerCase()),
    ...products.map(p => p.brand.toLowerCase()),
    ...products.flatMap(p => p.tags),
    ...POPULAR_SEARCHES.map(s => s.toLowerCase()),
  ];
  let best: string | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const words = c.split(' ');
    for (const word of words) {
      if (word.length < 3) continue;
      const dist = levenshtein(q, word);
      if (dist <= 2 && dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }
  }
  return best;
}

// ─── Highlight matched text ───────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded px-0.5 not-italic font-bold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Voice Mic Ripple ─────────────────────────────────────────────────────────

function MicRipple() {
  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-red-500"
          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%' }}
        />
      ))}
      <div className="relative z-10 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40">
        <Mic size={18} className="text-white" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SearchOverlay() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  // Load recent searches
  useEffect(() => {
    if (user) {
      supabase
        .from('search_history')
        .select('query')
        .eq('user_id', user.id)
        .order('searched_at', { ascending: false })
        .limit(MAX_RECENT)
        .then(({ data }) => {
          if (data) {
            const queries = data.map(item => item.query);
            setRecentSearches(Array.from(new Set(queries)));
          }
        });
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setRecentSearches(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, [user]);

  // Check voice support on mount
  useEffect(() => {
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setVoiceSupported(supported);
  }, []);

  // Open/close side effects
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery('');
      setVoiceError(null);
      setInterimTranscript('');
      setSelectedIdx(-1);
    } else {
      stopListening();
    }
  }, [isSearchOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSearchOpen, setSearchOpen]);

  // ── Search results ──────────────────────────────────────────────────────────

  const effectiveQuery = query || interimTranscript;

  const filteredProducts = effectiveQuery.length > 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
        p.subcategory?.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(effectiveQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  const suggestions = effectiveQuery.length > 1
    ? POPULAR_SEARCHES.filter(s =>
        s.toLowerCase().includes(effectiveQuery.toLowerCase()) && s.toLowerCase() !== effectiveQuery.toLowerCase()
      ).slice(0, 4)
    : [];

  const typoSuggestion = filteredProducts.length === 0 && effectiveQuery.length > 2
    ? findBestMatch(effectiveQuery)
    : null;

  // ── Save search ─────────────────────────────────────────────────────────────

  const saveSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => {
      const next = [term, ...prev.filter(s => s.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT);
      if (!user) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });

    if (user) {
      supabase.from('search_history').insert({
        user_id: user.id,
        query: term.trim()
      }).then();
    }
  }, [user]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (!user) {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    } else {
      supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)
        .then();
    }
  };

  const removeRecentSearch = (term: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(s => s !== term);
      if (!user) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });

    if (user) {
      supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)
        .eq('query', term)
        .then();
    }
  };

  // ── Submit search ───────────────────────────────────────────────────────────

  const handleSearch = (term: string = query) => {
    if (!term.trim()) return;
    saveSearch(term.trim());
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  // ── Keyboard navigation in results ──────────────────────────────────────────

  const allResults = [...filteredProducts.map(p => ({ type: 'product' as const, value: p }))];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIdx >= 0 && selectedIdx < filteredProducts.length) {
        const p = filteredProducts[selectedIdx];
        saveSearch(p.name);
        setSearchOpen(false);
        navigate(`/product/${p.slug}`);
      } else {
        handleSearch();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filteredProducts.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, -1));
    }
  };

  // ── Voice search ─────────────────────────────────────────────────────────────

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const handleVoiceSearch = () => {
    if (!voiceSupported) {
      setVoiceError('Voice search is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    setVoiceError(null);
    setQuery('');
    setInterimTranscript('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    // Prefer Indian English; fallback to Hindi
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError(null);
    };

    recognition.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimTranscript(interim);
      if (final) {
        setQuery(final.trim());
        setInterimTranscript('');
      }
    };

    recognition.onerror = (e: any) => {
      stopListening();
      switch (e.error) {
        case 'not-allowed':
          setVoiceError('Microphone access denied. Please allow microphone permission in your browser settings.');
          break;
        case 'network':
          setVoiceError('Network error during voice recognition. Please check your internet connection.');
          break;
        case 'no-speech':
          setVoiceError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setVoiceError('No microphone found. Please connect a microphone and try again.');
          break;
        default:
          setVoiceError('Voice recognition failed. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript(prev => {
        if (prev) {
          setQuery(prev.trim());
          return '';
        }
        return prev;
      });
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setVoiceError('Could not start voice recognition. Please try again.');
      setIsListening(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && setSearchOpen(false)}
        >
          {/* Panel */}
          <motion.div
            initial={{ y: -40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="bg-white dark:bg-gray-950 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Search Input ───────────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-4 pt-4 pb-3">
              <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 border-2 transition-all duration-200 ${
                isListening
                  ? 'border-red-400 bg-red-50 dark:bg-red-950/20 shadow-lg shadow-red-200/50 dark:shadow-red-900/30'
                  : 'border-purple-500 bg-gray-50 dark:bg-gray-900 shadow-lg shadow-purple-200/40 dark:shadow-purple-900/20'
              }`}>
                <Search size={20} className={`flex-shrink-0 transition-colors ${isListening ? 'text-red-400' : 'text-purple-500'}`} />

                <input
                  ref={inputRef}
                  type="text"
                  value={isListening && interimTranscript ? interimTranscript : query}
                  onChange={e => { setQuery(e.target.value); setSelectedIdx(-1); }}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? '🎤 Listening...' : 'Search for products, brands, categories...'}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-base"
                  readOnly={isListening}
                />

                {/* Keyboard shortcut hint */}
                {!query && !isListening && (
                  <kbd className="hidden lg:flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-mono bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                    Ctrl+K
                  </kbd>
                )}

                {/* Clear button */}
                {query && !isListening && (
                  <button
                    onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                    title="Clear"
                  >
                    <X size={17} />
                  </button>
                )}

                {/* Mic button */}
                <button
                  onClick={handleVoiceSearch}
                  title={isListening ? 'Stop listening' : 'Voice search'}
                  disabled={!voiceSupported}
                  className={`flex-shrink-0 rounded-xl p-2 transition-all duration-200 ${
                    !voiceSupported
                      ? 'opacity-30 cursor-not-allowed'
                      : isListening
                      ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'
                      : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                  }`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Close button */}
                <button
                  onClick={() => setSearchOpen(false)}
                  className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex-shrink-0 ml-1"
                >
                  <X size={14} />
                </button>
              </div>

              {/* ── Listening Status ───────────────────────────────────────── */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-center gap-4 mt-3 py-3 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800/40 overflow-hidden"
                  >
                    <MicRipple />
                    <div className="text-center">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">
                        Listening...
                      </p>
                      <p className="text-xs text-red-400 dark:text-red-500 mt-0.5">
                        {interimTranscript
                          ? `"${interimTranscript}"`
                          : 'Speak now in English or Hindi'}
                      </p>
                    </div>
                    <div className="flex items-end gap-0.5 h-6">
                      {[3, 5, 8, 5, 3, 6, 4, 7, 3].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-1 rounded-full bg-red-400"
                          animate={{ height: [h, h * 2.5, h] }}
                          transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ height: h }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Voice Error ────────────────────────────────────────────── */}
              <AnimatePresence>
                {voiceError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 mt-2.5 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 rounded-xl"
                  >
                    <AlertCircle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">{voiceError}</p>
                    <button onClick={() => setVoiceError(null)} className="ml-auto text-orange-400 hover:text-orange-600 flex-shrink-0">
                      <X size={13} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Results Area ───────────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-4 pb-5 max-h-[70vh] overflow-y-auto">
              <AnimatePresence mode="wait">

                {/* ── LIVE PRODUCT RESULTS ─────────────────────────────────── */}
                {effectiveQuery.length > 1 && (filteredProducts.length > 0 || suggestions.length > 0) && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {/* Suggestions row */}
                    {suggestions.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="text-xs text-gray-400">Did you mean:</span>
                        {suggestions.map(s => (
                          <button
                            key={s}
                            onClick={() => setQuery(s)}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500">
                        {filteredProducts.length > 0
                          ? `${filteredProducts.length} result${filteredProducts.length !== 1 ? 's' : ''} for "${effectiveQuery}"`
                          : 'Suggestions'}
                      </p>
                    </div>

                    {/* Product Results */}
                    {filteredProducts.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {filteredProducts.map((product, idx) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.slug}`}
                            onClick={() => { saveSearch(effectiveQuery); setSearchOpen(false); }}
                            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all group ${
                              selectedIdx === idx
                                ? 'bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-300 dark:ring-purple-700'
                                : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                            }`}
                          >
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-800">
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {product.isFlashSale && (
                                <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-[9px] font-bold text-center py-0.5">
                                  SALE
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-purple-600 font-semibold">{product.brand}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                                <Highlight text={product.name} query={effectiveQuery} />
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
                                {product.mrp > product.price && (
                                  <>
                                    <span className="text-xs line-through text-gray-400">{formatPrice(product.mrp)}</span>
                                    <span className="text-xs font-bold text-green-600">{product.discount}% off</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowUpRight size={14} className="text-purple-500" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* View all link */}
                    <Link
                      to={`/search?q=${encodeURIComponent(effectiveQuery)}`}
                      onClick={() => { saveSearch(effectiveQuery); setSearchOpen(false); }}
                      className="flex items-center justify-center gap-2 py-2.5 text-purple-600 dark:text-purple-400 font-semibold text-sm hover:text-purple-700 border-t border-gray-100 dark:border-gray-800 pt-4"
                    >
                      <Search size={14} />
                      View all results for "{effectiveQuery}"
                      <ArrowUpRight size={14} />
                    </Link>
                  </motion.div>
                )}

                {/* ── NO RESULTS ────────────────────────────────────────────── */}
                {effectiveQuery.length > 1 && filteredProducts.length === 0 && suggestions.length === 0 && (
                  <motion.div
                    key="no-results"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                      <Search size={28} className="text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">No results found</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      We couldn't find anything for "<span className="font-semibold text-gray-700 dark:text-gray-300">{effectiveQuery}</span>"
                    </p>

                    {typoSuggestion && (
                      <div className="mb-5">
                        <p className="text-xs text-gray-400 mb-2">Did you mean?</p>
                        <button
                          onClick={() => setQuery(typoSuggestion)}
                          className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors capitalize"
                        >
                          {typoSuggestion}
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mb-3">Try these instead:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {POPULAR_SEARCHES.slice(0, 4).map(s => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── SUGGESTIONS (no active query) ─────────────────────────── */}
                {effectiveQuery.length <= 1 && (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-2"
                  >
                    {/* Popular Searches */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={14} className="text-orange-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Popular</span>
                      </div>
                      <div className="space-y-1.5">
                        {POPULAR_SEARCHES.map(s => (
                          <button
                            key={s}
                            onClick={() => setQuery(s)}
                            className="flex items-center justify-between w-full gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group text-left"
                          >
                            <span className="flex items-center gap-2">
                              <Search size={12} className="text-gray-400 flex-shrink-0" />
                              {s}
                            </span>
                            <ArrowUpRight size={12} className="text-gray-300 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Searches */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-blue-500" />
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent</span>
                        </div>
                        {recentSearches.length > 0 && (
                          <button
                            onClick={clearRecentSearches}
                            className="text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      {recentSearches.length === 0 ? (
                        <p className="text-xs text-gray-400 italic px-3">No recent searches</p>
                      ) : (
                        <div className="space-y-1.5">
                          {recentSearches.slice(0, 6).map(s => (
                            <div key={s} className="flex items-center gap-1 group">
                              <button
                                onClick={() => setQuery(s)}
                                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                              >
                                <Clock size={12} className="text-gray-400 flex-shrink-0" />
                                {s}
                              </button>
                              <button
                                onClick={() => removeRecentSearch(s)}
                                className="p-1 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Trending Tags */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} className="text-purple-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trending</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {TRENDING_TAGS.map((tag, i) => (
                          <motion.button
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => setQuery(tag)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-800/40 dark:hover:to-blue-800/40 transition-all hover:scale-105"
                          >
                            #{tag}
                          </motion.button>
                        ))}
                      </div>

                      {/* Voice search promo */}
                      <div className="mt-5 p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-100 dark:border-purple-800/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Mic size={13} className="text-purple-500" />
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Try Voice Search</span>
                        </div>
                        <p className="text-[11px] text-purple-500 dark:text-purple-400">
                          Click the mic and say what you're looking for in English or Hindi
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
