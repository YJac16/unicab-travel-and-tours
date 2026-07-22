import React, { useState } from 'react';

function PasswordInput({ 
  value, 
  onChange, 
  placeholder, 
  required, 
  minLength,
  style = {},
  error,
  onFocus,
  onBlur,
  id,
  name,
  autoComplete
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 2.5rem 0.75rem 0.75rem",
    border: `1px solid ${error ? "#e74c3c" : "var(--border-soft)"}`,
    borderRadius: "8px",
    fontSize: "0.9rem",
    ...style
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        style={inputStyle}
        onFocus={onFocus}
        onBlur={onBlur}
        id={id}
        name={name}
        autoComplete={autoComplete || (name?.includes('current') ? 'current-password' : name?.includes('new') || name?.includes('confirm') ? 'new-password' : 'password')}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isHovered ? "var(--accent-gold)" : "var(--text-muted)",
          transition: "color 0.2s ease"
        }}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          // Eye closed icon (hide password)
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        ) : (
          // Eye open icon (show password)
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        )}
      </button>
    </div>
  );
}

export default PasswordInput;







