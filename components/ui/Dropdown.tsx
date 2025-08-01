"use client";
import { DropdownProps } from '@/types/dropdown';
import { Icon } from '@/components/ui/Icon';
import { useDropdown } from '@/hooks/useDropdown';
import { motion, AnimatePresence } from 'framer-motion';

export function Dropdown({
  currentIcon,
  options,
  direction,
  className,
  onSelect,
  ariaLabel
}: Readonly<DropdownProps>) {
  const { open, dropdownRef, toggleDropdown, handleKeyDown } = useDropdown();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label={`Current ${ariaLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${ariaLabel}-menu`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 p-1 w-10 h-10 bg-background border border-[var(--border-color)]  rounded-lg shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_0_rgba(0,0,0,0.12)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Icon name={currentIcon} size={18} className={`text-base m-auto ${className}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={`overflow-hidden absolute mt-2 w-40 min-w-max bg-background border border-[var(--border-color)]  rounded-lg shadow-xl z-50 top-10 right-0 ${direction}`}
            role="menu"
            id={`${ariaLabel}-menu`}
            aria-label={`${ariaLabel} selection menu`}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                role="menuitemradio"
                aria-checked={option.isSelected}
                onClick={() => {
                  if (onSelect) onSelect(option.key);
                  toggleDropdown();
                }}
                className={`group flex items-center w-full px-4 py-2 text-left text-sm transition-colors 
                  ${option.isSelected
                    ? "bg-primary/10 text-primary font-bold"
                    : "hover:bg-[var(--hover)] "}
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                `}
              >
                {option.icon && (
                  <Icon name={option.icon} className='w-4 h-4 mr-2 text-primary/80 group-hover:text-primary' aria-hidden="true" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="capitalize text-color truncate block">{option.label}</span>
                  {option.content && option.date && (
                    <div className='flex flex-col text-xs text-gray-400 mt-0.5'>
                      <span className="truncate whitespace-pre-line">{option.content}</span>
                      <span className="truncate">{option.date.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {option.isSelected && (
                  <Icon name="Check" className="ml-2 w-4 h-4 text-primary" aria-hidden="true" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}