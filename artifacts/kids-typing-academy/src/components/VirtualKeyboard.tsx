import React from 'react';
import { cn } from '@/lib/utils';

interface VirtualKeyboardProps {
  activeKey?: string;
  correctFlash?: boolean;
  wrongFlash?: boolean;
}

const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Space']
];

const FINGER_COLORS: Record<string, string> = {
  // Left pinky
  '1': 'bg-indigo-200', 'q': 'bg-indigo-200', 'a': 'bg-indigo-200', 'z': 'bg-indigo-200', 'Tab': 'bg-indigo-200', 'Caps': 'bg-indigo-200', 'Shift': 'bg-indigo-200',
  // Left ring
  '2': 'bg-blue-200', 'w': 'bg-blue-200', 's': 'bg-blue-200', 'x': 'bg-blue-200',
  // Left middle
  '3': 'bg-teal-200', 'e': 'bg-teal-200', 'd': 'bg-teal-200', 'c': 'bg-teal-200',
  // Left index
  '4': 'bg-emerald-200', '5': 'bg-emerald-200', 'r': 'bg-emerald-200', 't': 'bg-emerald-200', 'f': 'bg-emerald-200', 'g': 'bg-emerald-200', 'v': 'bg-emerald-200', 'b': 'bg-emerald-200',
  // Right index
  '6': 'bg-amber-200', '7': 'bg-amber-200', 'y': 'bg-amber-200', 'u': 'bg-amber-200', 'h': 'bg-amber-200', 'j': 'bg-amber-200', 'n': 'bg-amber-200', 'm': 'bg-amber-200',
  // Right middle
  '8': 'bg-yellow-200', 'i': 'bg-yellow-200', 'k': 'bg-yellow-200', ',': 'bg-yellow-200',
  // Right ring
  '9': 'bg-rose-200', 'o': 'bg-rose-200', 'l': 'bg-rose-200', '.': 'bg-rose-200',
  // Right pinky
  '0': 'bg-red-200', '-': 'bg-red-200', '=': 'bg-red-200', 'p': 'bg-red-200', '[': 'bg-red-200', ']': 'bg-red-200', '\\': 'bg-red-200', ';': 'bg-red-200', "'": 'bg-red-200', '/': 'bg-red-200', 'Enter': 'bg-red-200', 'Backspace': 'bg-red-200',
  // Space
  'Space': 'bg-gray-200'
};

export function VirtualKeyboard({ activeKey, correctFlash, wrongFlash }: VirtualKeyboardProps) {
  const getWidthClass = (key: string) => {
    switch (key) {
      case 'Backspace': return 'w-20';
      case 'Tab': return 'w-16';
      case '\\': return 'w-14';
      case 'Caps': return 'w-20';
      case 'Enter': return 'w-20';
      case 'Shift': return 'w-24';
      case 'Space': return 'w-[32rem]';
      default: return 'w-12';
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-2xl border mx-auto w-max" data-testid="virtual-keyboard">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-2">
          {row.map((key, j) => {
            const isMatch = activeKey && (
              key.toLowerCase() === activeKey.toLowerCase() || 
              (key === 'Space' && activeKey === ' ') ||
              (key === 'Shift' && activeKey === activeKey.toUpperCase() && activeKey !== activeKey.toLowerCase())
            );
            
            return (
              <div
                key={`${i}-${j}-${key}`}
                className={cn(
                  "h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-150 border-b-4 border-black/10 select-none",
                  getWidthClass(key),
                  FINGER_COLORS[key] || 'bg-gray-200',
                  isMatch && correctFlash && "bg-green-400 text-white border-green-600 scale-105 shadow-md",
                  isMatch && wrongFlash && "bg-red-400 text-white border-red-600 scale-105 shadow-md",
                  isMatch && !correctFlash && !wrongFlash && "ring-4 ring-primary/50 scale-105 shadow-md brightness-110",
                  "text-foreground/80"
                )}
              >
                {key === 'Space' ? '' : key}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
