import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

const DropdownContext = createContext();

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

const DropdownMenuTrigger = ({ asChild, children, className, ...props }) => {
  const { open, setOpen } = useContext(DropdownContext);
  const triggerRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    setOpen(!open);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open, setOpen]);

  if (asChild) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: handleClick,
      'aria-expanded': open,
      'aria-haspopup': 'true',
    });
  }

  return (
    <button
      ref={triggerRef}
      onClick={handleClick}
      className={cn(className)}
      aria-expanded={open}
      aria-haspopup="true"
      {...props}
    >
      {children}
    </button>
  );
};

const DropdownMenuContent = ({ 
  children, 
  className, 
  align = 'center',
  sideOffset = 4,
  ...props 
}) => {
  const { open, setOpen } = useContext(DropdownContext);
  const contentRef = useRef(null);

  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  };

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        alignClasses[align],
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuLabel = ({ className, ...props }) => (
  <div
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-gray-900",
      className
    )}
    {...props}
  />
);

const DropdownMenuSeparator = ({ className, ...props }) => (
  <div
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
    {...props}
  />
);

const DropdownMenuItem = ({ 
  className, 
  asChild,
  disabled,
  children,
  onClick,
  onSelect,
  ...props 
}) => {
  const { setOpen } = useContext(DropdownContext);

  const handleClick = (event) => {
    console.log('DropdownMenuItem handleClick called');
    
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Execute custom handlers first
    try {
      if (onClick) {
        console.log('Calling onClick handler');
        onClick(event);
      }
      
      if (onSelect) {
        console.log('Calling onSelect handler');  
        onSelect(event);
      }
    } catch (error) {
      console.error('Error in dropdown item handlers:', error);
    }
    
    // Always close the dropdown after handlers execute
    setTimeout(() => {
      setOpen(false);
    }, 50);
  };

  if (asChild) {
    return React.cloneElement(children, {
      onClick: handleClick,
      className: cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-gray-100 focus:bg-gray-100",
        disabled && "pointer-events-none opacity-50",
        className
      ),
    });
  }

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-gray-100 focus:bg-gray-100",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()} // Prevent focus issues
      {...props}
    >
      {children}
    </div>
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
};