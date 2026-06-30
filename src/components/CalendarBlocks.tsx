import React, { useState } from "react";
import { Calendar, Plus, Trash2, ShieldAlert } from "lucide-react";
import { BusyBlock } from "../types";

interface CalendarBlocksProps {
  busyBlocks: BusyBlock[];
  setBusyBlocks: React.Dispatch<React.SetStateAction<BusyBlock[]>>;
  addSystemLog: (text: string, type: "info" | "warning" | "success" | "error") => void;
}

export default function CalendarBlocks({
  busyBlocks,
  setBusyBlocks,
  addSystemLog,
}: CalendarBlocksProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const now = new Date();
    const defaultStart = new Date(now.getTime() + 1.5 * 60 * 60 * 1000).toISOString().substring(0, 16);
    const defaultEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().substring(0, 16);

    const newBlock: BusyBlock = {
      id: "block-" + Date.now(),
      label: label.trim(),
      start: start || defaultStart,
      end: end || defaultEnd,
    };

    setBusyBlocks(prev => [...prev, newBlock]);
    addSystemLog(`Registered calendar block: "${newBlock.label}" to avoid AI focus collision.`, "info");
    
    setLabel("");
    setStart("");
    setEnd("");
    setShowAdd(false);
  };

  const handleDeleteBlock = (id: string, name: string) => {
    setBusyBlocks(prev => prev.filter(b => b.id !== id));
    addSystemLog(`Deleted conflict exclusion block: "${name}".`, "warning");
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg" id="calendar-blocks-widget">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 uppercase font-mono">
            <Calendar className="w-4 h-4 text-sky-400" />
            Calendar Exclusions
          </h2>
          <p className="text-[10px] text-neutral-400">AI scheduling will skip these slots</p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] uppercase font-mono rounded-lg transition duration-150 cursor-pointer border border-neutral-700"
          id="btn-add-exclusion-toggle"
        >
          <Plus className="w-3 h-3" />
          Exclude Slot
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddBlock} className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl mb-3 space-y-2" id="exclusion-create-form">
          <div>
            <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase mb-0.5">Event Label</label>
            <input
              type="text"
              required
              placeholder="e.g., Mandatory Team Sync"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded px-2.5 py-1 text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase mb-0.5">Start Time</label>
              <input
                type="datetime-local"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded px-2 py-1 text-[10px] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase mb-0.5">End Time</label>
              <input
                type="datetime-local"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded px-2 py-1 text-[10px] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-[10px] rounded cursor-pointer"
            >
              Lock Exclusion
            </button>
          </div>
        </form>
      )}

      {/* Busy slots scroll list */}
      <div className="space-y-2 lg:max-h-[140px] max-h-none lg:overflow-y-auto overflow-visible pr-1">
        {busyBlocks.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-neutral-800/80 rounded-xl" id="no-exclusions-placeholder">
            <p className="text-[10px] text-neutral-500 font-mono">No calendar conflicts registered.</p>
          </div>
        ) : (
          busyBlocks.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-neutral-950 border border-neutral-800 p-2.5 rounded-xl gap-2" id={`exclusion-block-${b.id}`}>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-neutral-200 truncate block">{b.label}</span>
                <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">
                  {b.start.replace("T", " ")} to {b.end.replace(/.*T/, "")}
                </span>
              </div>
              <button
                onClick={() => handleDeleteBlock(b.id, b.label)}
                className="text-neutral-500 hover:text-rose-500 hover:bg-neutral-900 p-1 rounded transition shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
