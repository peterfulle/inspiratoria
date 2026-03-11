'use client';

interface ToggleProps {
  active: boolean;
  onChange: () => void;
}

export default function Toggle({ active, onChange }: ToggleProps) {
  return (
    <div 
      className={`toggle ${active ? 'active' : ''}`}
      onClick={onChange}
    >
      <div className="toggle-dot" />
    </div>
  );
}
