import React from 'react';

export const Spinner: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <div className={`animate-spin rounded-full border-2 border-t-transparent border-current ${className}`} role="status">
        <span className="sr-only">Loading...</span>
    </div>
);
