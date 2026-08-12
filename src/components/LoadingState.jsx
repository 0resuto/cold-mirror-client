import React from 'react';
import { Activity } from 'lucide-react';

export function LoadingState({ message = "Waiting for telemetry..." }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1b1e]/60 border border-white/10 rounded-xl backdrop-blur-md p-4">
      <Activity className="text-[#e8590c] mb-3 animate-pulse" size={28} />
      <div className="flex flex-col items-center">
        <span className="text-white/80 font-bold text-sm tracking-wider uppercase text-center">{message}</span>
        <span className="text-white/40 text-[10px] font-mono mt-1">iRacing Data Link</span>
      </div>
    </div>
  );
}
