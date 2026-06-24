import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

/**
 * Premium Searchable Select Component
 * @param {Object} props
 * @param {Array} props.options - Array of { id, name } objects
 * @param {string} props.value - Selected ID
 * @param {function} props.onChange - Callback with selected ID
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional classes
 */
const SearchableSelect = ({ options = [], value, onChange, placeholder = 'Select an option', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selectedOption = options.find(opt => opt.id === value);

    const filteredOptions = options.filter(opt =>
        String(opt.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchTerm('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleSelect = (option) => {
        onChange(option.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <div
                onClick={handleToggle}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl cursor-pointer transition-all border outline-none"
                style={{
                    background: 'var(--pos-card, #f8fafc)',
                    borderColor: 'var(--pos-border, #e2e8f0)',
                    color: 'var(--pos-text, #0f172a)'
                }}
            >
                <span className={`text-sm ${selectedOption ? 'font-semibold' : 'opacity-40'}`}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown size={18} className={`opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Panel */}
            {isOpen && (
                <div
                    className="absolute z-[60] w-full mt-2 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn border"
                    style={{
                        background: 'var(--pos-surface, #ffffff)',
                        borderColor: 'var(--pos-border, rgba(0,0,0,0.1))',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        color: 'var(--pos-text, #000)'
                    }}
                >
                    {/* Search Input Filter */}
                    <div className="p-3 border-b flex items-center gap-2 sticky top-0" style={{ background: 'var(--pos-card)', borderColor: 'var(--pos-border)' }}>
                        <Search size={16} className="opacity-40 ml-1" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full py-1.5 text-sm bg-transparent border-none focus:ring-0 outline-none"
                            style={{ color: 'var(--pos-text)' }}
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Options List */}
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.id}
                                    onClick={() => handleSelect(opt)}
                                    className={`flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-colors ${value === opt.id
                                            ? 'bg-blue-600/10 text-blue-400 font-bold'
                                            : 'hover:bg-white/5'
                                        }`}
                                    style={{
                                        color: value === opt.id ? 'var(--pos-blue)' : 'inherit'
                                    }}
                                >
                                    <span>{opt.name}</span>
                                    {value === opt.id && <Check size={16} className="text-blue-500" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center opacity-40 text-xs italic">
                                No results for "{searchTerm}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
