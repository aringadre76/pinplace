import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/Input';

const SEARCH_DEBOUNCE_DELAY = 500; // milliseconds

interface CityResult {
  name: string;
  country: string;
  lat: number;
  lng: number;
  displayName: string;
}

interface CitySearchBarProps {
  onCitySelect: (city: CityResult) => void;
  disabled?: boolean;
}

export const CitySearchBar: React.FC<CitySearchBarProps> = ({ 
  onCitySelect, 
  disabled = false 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const searchCities = async (searchQuery: string): Promise<CityResult[]> => {
    if (!searchQuery.trim()) return [];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&extratags=1`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      
      return data
        .filter((item: any) => 
          item.class === 'place' || 
          item.type === 'city' || 
          item.type === 'town' || 
          item.type === 'village' ||
          item.type === 'administrative' ||
          (item.address && (item.address.city || item.address.town || item.address.village))
        )
        .map((item: any) => ({
          name: item.name || item.display_name.split(',')[0],
          country: item.address?.country || 'Unknown',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          displayName: item.display_name
        }))
        .slice(0, 5);
    } catch (error) {
      console.error('Error searching cities:', error);
      return [];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim()) {
      setIsLoading(true);
      // Debounce search by 500ms
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const searchResults = await searchCities(value);
          setResults(searchResults);
          setShowResults(searchResults.length > 0);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
          setShowResults(false);
        } finally {
          setIsLoading(false);
        }
      }, SEARCH_DEBOUNCE_DELAY);
    } else {
      setResults([]);
      setIsLoading(false);
      setShowResults(false);
    }
  };

  const handleCitySelect = (city: CityResult) => {
    setQuery('');
    setShowResults(false);
    setResults([]);
    onCitySelect(city);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleCitySelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      inputRef.current && 
      !inputRef.current.contains(e.target as Node) &&
      resultsRef.current &&
      !resultsRef.current.contains(e.target as Node)
    ) {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Clear any pending search timeout on unmount
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <Input
        ref={inputRef}
        placeholder="Search for a city..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="pr-10"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {results.map((city, index) => (
            <div
              key={`${city.name}-${city.country}-${city.lat}-${city.lng}-${index}`}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 active:scale-[0.98] transition-transform ${
                index === selectedIndex 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'hover:bg-gray-50 active:bg-gray-100'
              }`}
              onClick={() => handleCitySelect(city)}
            >
              <div className="font-medium text-sm">{city.name}</div>
              <div className="text-xs text-gray-500">{city.country}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
