import { useState, useRef, useEffect } from 'react';

interface Page {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
}

interface Props {
  pages: Page[];
}

export function SearchBox({ pages }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.length > 0
    ? pages.filter((page) =>
        page.title.toLowerCase().includes(query.toLowerCase()) ||
        page.description.toLowerCase().includes(query.toLowerCase()) ||
        page.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())) ||
        page.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      window.location.href = `/${results[selectedIndex].slug}`;
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search problems..."
        className="w-full px-3.5 py-2.5 text-[15px] rounded-lg bg-bg border border-border focus:border-text-secondary outline-none transition-colors text-text placeholder:text-text-secondary/50"
      />

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-bg border border-border rounded-lg overflow-hidden z-50">
          {results.map((page, index) => (
            <a
              key={page.slug}
              href={`/${page.slug}`}
              className={`block px-3.5 py-2.5 transition-colors ${
                index === selectedIndex ? 'bg-bg-secondary' : 'hover:bg-bg-secondary'
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="text-[14px]">{page.title}</div>
              <div className="text-[12px] text-text-secondary mt-0.5 truncate">{page.description}</div>
            </a>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-bg border border-border rounded-lg p-3.5 text-center text-[13px] text-text-secondary z-50">
          No results for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
