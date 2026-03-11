"use client";

import React, { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// INFLUENCE BUBBLES COMPONENT - Light Theme
// Real-time influence visualization with minimal white aesthetic
// ═══════════════════════════════════════════════════════════════════

interface InfluenceUser {
  id: number;
  name: string;
  avatar: string;
  influence: number;
  role?: string;
}

interface InfluenceBubblesProps {
  users: InfluenceUser[];
  centerLabel?: string;
  centerValue?: number;
  showLegend?: boolean;
  size?: "sm" | "md" | "lg";
}

// Animation keyframes
const animationStyles = `
@keyframes float0 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(5px, -8px); }
}
@keyframes float1 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-6px, 6px); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(8px, 4px); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}
@keyframes orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes energy-pulse {
  0%, 100% { opacity: 0.3; r: 3; }
  50% { opacity: 0.8; r: 5; }
}
`;

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function InfluenceBubbles({ 
  users = [], 
  centerLabel = "TÚ", 
  centerValue,
  showLegend = true,
  size = "md"
}: InfluenceBubblesProps) {
  const [animatedInfluence, setAnimatedInfluence] = useState<{[key: number]: number}>({});
  
  // Safety check for users
  const safeUsers = users || [];
  
  // Size configurations
  const sizes = {
    sm: { container: 220, center: 35, node: 22, radius: 70 },
    md: { container: 280, center: 45, node: 28, radius: 90 },
    lg: { container: 360, center: 55, node: 35, radius: 120 },
  };
  
  const config = sizes[size];
  const centerPoint = config.container / 2;

  useEffect(() => {
    if (!safeUsers.length) return;
    // Initialize
    const initial: {[key: number]: number} = {};
    safeUsers.forEach(u => initial[u.id] = 0);
    setAnimatedInfluence(initial);
    
    // Animate to actual values
    setTimeout(() => {
      const values: {[key: number]: number} = {};
      safeUsers.forEach(u => values[u.id] = u.influence);
      setAnimatedInfluence(values);
    }, 200);
  }, [safeUsers]);

  // Real-time fluctuation
  useEffect(() => {
    if (!safeUsers.length) return;
    const interval = setInterval(() => {
      setAnimatedInfluence(prev => {
        const updated: {[key: number]: number} = {};
        safeUsers.forEach(u => {
          const base = u.influence;
          const fluctuation = (Math.random() - 0.5) * 3;
          updated[u.id] = Math.max(0, Math.min(100, base + fluctuation));
        });
        return updated;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [safeUsers]);

  const totalInfluence = centerValue !== undefined 
    ? centerValue 
    : safeUsers.length > 0 
      ? safeUsers.reduce((sum, u) => sum + (animatedInfluence[u.id] || 0), 0) / safeUsers.length
      : 0;

  const getPosition = (index: number, total: number, radius: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: centerPoint + Math.cos(angle) * radius,
      y: centerPoint + Math.sin(angle) * radius,
    };
  };

  return (
    <div className="relative">
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <div 
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
      >
        {/* Header */}
        <div 
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: "#FEF3C7" }}>
              <svg 
                className="w-5 h-5" 
                viewBox="0 0 24 24" 
                fill="#D97706"
              >
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
                Tu Influencia
              </h3>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                Impacto en tiempo real
              </p>
            </div>
          </div>
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "#ECFDF5" }}
          >
            <span 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "#10B981" }}
            />
            <span className="text-xs font-medium" style={{ color: "#059669" }}>
              En vivo
            </span>
          </div>
        </div>

        {/* Visualization */}
        <div className="p-6">
          <div 
            className="relative mx-auto"
            style={{ width: config.container, height: config.container }}
          >
            <svg 
              width={config.container} 
              height={config.container} 
              viewBox={`0 0 ${config.container} ${config.container}`}
            >
              {/* Orbital rings */}
              {[0.7, 0.85, 1].map((factor, i) => (
                <circle
                  key={i}
                  cx={centerPoint}
                  cy={centerPoint}
                  r={config.radius * factor}
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
              ))}

              {/* Connection lines with gradient */}
              {safeUsers.map((user, index) => {
                const pos = getPosition(index, safeUsers.length, config.radius);
                const influence = animatedInfluence[user.id] || 0;
                return (
                  <g key={`line-${user.id}`}>
                    <defs>
                      <linearGradient 
                        id={`grad-${user.id}`} 
                        x1="0%" y1="0%" 
                        x2="100%" y2="0%"
                      >
                        <stop offset="0%" stopColor="#FFD902" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                    <line
                      x1={centerPoint}
                      y1={centerPoint}
                      x2={pos.x}
                      y2={pos.y}
                      stroke={`url(#grad-${user.id})`}
                      strokeWidth={Math.max(1.5, influence / 25)}
                      style={{ transition: "stroke-width 1s ease" }}
                    />
                    {/* Energy pulse traveling along line */}
                    <circle r="3" fill="#FFD902" opacity="0.8">
                      <animateMotion
                        dur={`${2 + index * 0.3}s`}
                        repeatCount="indefinite"
                        path={`M${centerPoint},${centerPoint} L${pos.x},${pos.y}`}
                      />
                    </circle>
                  </g>
                );
              })}

              {/* Central node (Mentor/You) */}
              <g>
                <circle 
                  cx={centerPoint} 
                  cy={centerPoint} 
                  r={config.center} 
                  fill="#FFD902" 
                />
                <circle 
                  cx={centerPoint} 
                  cy={centerPoint} 
                  r={config.center + 5} 
                  fill="none" 
                  stroke="#FFD902" 
                  strokeWidth="2" 
                  opacity="0.3" 
                />
                <text 
                  x={centerPoint} 
                  y={centerPoint - 5} 
                  textAnchor="middle" 
                  fill="#1a1a1a" 
                  fontSize={size === "sm" ? "14" : "18"} 
                  fontWeight="bold"
                >
                  {totalInfluence.toFixed(0)}%
                </text>
                <text 
                  x={centerPoint} 
                  y={centerPoint + 12} 
                  textAnchor="middle" 
                  fill="#1a1a1a" 
                  fontSize="10" 
                  opacity="0.7"
                >
                  {centerLabel}
                </text>
              </g>

              {/* User nodes */}
              {safeUsers.map((user, index) => {
                const pos = getPosition(index, safeUsers.length, config.radius);
                const influence = animatedInfluence[user.id] || 0;
                const circumference = 2 * Math.PI * config.node;
                
                return (
                  <g 
                    key={user.id}
                    style={{ 
                      animation: `float${index % 3} ${4 + index}s ease-in-out infinite` 
                    }}
                  >
                    {/* Influence progress ring */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={config.node}
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={config.node}
                      fill="none"
                      stroke="#60A5FA"
                      strokeWidth="3"
                      strokeDasharray={`${(influence / 100) * circumference} ${circumference}`}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${pos.x} ${pos.y})`}
                      style={{ transition: "stroke-dasharray 1s ease" }}
                    />
                    
                    {/* Avatar */}
                    <clipPath id={`clip-${user.id}`}>
                      <circle cx={pos.x} cy={pos.y} r={config.node - 4} />
                    </clipPath>
                    <image
                      href={user.avatar}
                      x={pos.x - (config.node - 4)}
                      y={pos.y - (config.node - 4)}
                      width={(config.node - 4) * 2}
                      height={(config.node - 4) * 2}
                      clipPath={`url(#clip-${user.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={config.node - 4}
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    
                    {/* Influence badge */}
                    <circle
                      cx={pos.x + config.node * 0.65}
                      cy={pos.y - config.node * 0.65}
                      r="12"
                      fill="#fff"
                      stroke="#60A5FA"
                      strokeWidth="1.5"
                    />
                    <text
                      x={pos.x + config.node * 0.65}
                      y={pos.y - config.node * 0.65 + 4}
                      textAnchor="middle"
                      fill="#1a1a1a"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {influence.toFixed(0)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#FFD902" }}
                />
                <span className="text-xs" style={{ color: "#6b7280" }}>
                  Mentor (Tú)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#60A5FA" }}
                />
                <span className="text-xs" style={{ color: "#6b7280" }}>
                  Mentees
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INFLUENCE RING - Standalone Component
// ═══════════════════════════════════════════════════════════════════

interface InfluenceRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  color?: string;
}

export function InfluenceRing({ 
  value, 
  size = 60, 
  strokeWidth = 4,
  showLabel = true,
  color = "#60A5FA"
}: InfluenceRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    setTimeout(() => setAnimatedValue(value), 100);
  }, [value]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${(animatedValue / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      </svg>
      {showLabel && (
        <span 
          className="absolute text-sm font-bold"
          style={{ color: "#1a1a1a" }}
        >
          {animatedValue.toFixed(0)}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INFLUENCE INDICATOR - Compact Badge Version
// ═══════════════════════════════════════════════════════════════════

interface InfluenceIndicatorProps {
  value: number;
  size?: "sm" | "md" | "lg";
  showPulse?: boolean;
}

export function InfluenceIndicator({ 
  value, 
  size = "md",
  showPulse = true
}: InfluenceIndicatorProps) {
  const sizes = {
    sm: { container: "w-8 h-8", text: "text-xs", pulse: "w-10 h-10" },
    md: { container: "w-10 h-10", text: "text-sm", pulse: "w-12 h-12" },
    lg: { container: "w-12 h-12", text: "text-base", pulse: "w-14 h-14" },
  };
  
  const config = sizes[size];
  
  // Color based on value
  const getColor = (v: number) => {
    if (v >= 80) return { bg: "#ECFDF5", border: "#10B981", text: "#059669" };
    if (v >= 60) return { bg: "#EFF6FF", border: "#60A5FA", text: "#2563EB" };
    if (v >= 40) return { bg: "#FEF3C7", border: "#F59E0B", text: "#D97706" };
    return { bg: "#FEF2F2", border: "#F87171", text: "#DC2626" };
  };
  
  const colors = getColor(value);

  return (
    <div className="relative inline-flex items-center justify-center">
      {showPulse && (
        <span 
          className={`absolute ${config.pulse} rounded-full animate-ping opacity-20`}
          style={{ backgroundColor: colors.border }}
        />
      )}
      <div 
        className={`${config.container} rounded-full flex items-center justify-center border-2`}
        style={{ 
          backgroundColor: colors.bg, 
          borderColor: colors.border 
        }}
      >
        <span 
          className={`${config.text} font-bold`}
          style={{ color: colors.text }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export default InfluenceBubbles;
