import { useState, useRef, useEffect } from 'react';
import './ColorSelect.css';

interface ColorSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

const ColorSelect = ({ value, onChange, options }: ColorSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getManaSymbol = (color: string) => {
    switch (color) {
      case 'white': return 'ms-w';
      case 'blue': return 'ms-u';
      case 'black': return 'ms-b';
      case 'red': return 'ms-r';
      case 'green': return 'ms-g';
      case 'colorless': return 'ms-c';
      case 'multicolor': return 'ms-m';
      default: return '';
    }
  };

  return (
    <div className="color-select" ref={selectRef}>
      <div 
        className="color-select-header" 
        onClick={() => setIsOpen(!isOpen)}
        title={value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Any'}
      >
        {value ? (
          <span className={`ms ${getManaSymbol(value)} ms-cost`}></span>
        ) : (
          <span className="any-text">Any</span>
        )}
      </div>
      {isOpen && (
        <div className="color-select-options">
          <div 
            className="color-select-option"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            title="Any"
          >
            <span className="any-text">Any</span>
          </div>
          {options.map(color => (
            <div
              key={color}
              className="color-select-option"
              onClick={() => {
                onChange(color);
                setIsOpen(false);
              }}
              title={color.charAt(0).toUpperCase() + color.slice(1)}
            >
              <span className={`ms ${getManaSymbol(color)} ms-cost`}></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorSelect; 