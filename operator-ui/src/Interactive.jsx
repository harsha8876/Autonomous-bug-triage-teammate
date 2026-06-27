import { useState } from 'react';

// A button that merges hover styles, mirroring the original style-hover behavior.
export function HoverButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      {...props}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={hover ? { ...baseStyle, ...hoverStyle } : baseStyle}
    >
      {children}
    </button>
  );
}

// A div with hover styles (used for cards).
export function HoverDiv({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      {...props}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={hover ? { ...baseStyle, ...hoverStyle } : baseStyle}
    >
      {children}
    </div>
  );
}

// Inputs / textareas with focus styles.
export function FocusInput({ baseStyle, focusStyle, as = 'input', ...props }) {
  const [focused, setFocused] = useState(false);
  const Tag = as;
  return (
    <Tag
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={focused ? { ...baseStyle, ...focusStyle } : baseStyle}
    />
  );
}
