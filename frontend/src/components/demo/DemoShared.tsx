"use client";

import { Check, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { DemoView, SubmissionStatus, statusStyles } from "./demoData";

export function PrototypeBar({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 bg-[#162A2B] px-4 py-2 text-xs text-white sm:px-6">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/15 px-2 py-0.5 font-semibold">
          Interactive preview
        </span>
        <span className="hidden text-white/70 sm:inline">
          Sample data only · no information is saved
        </span>
      </div>
      <button
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
        onClick={onReset}
        type="button"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset
      </button>
    </div>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 grid-cols-2 gap-[3px] rounded-[10px] bg-[#275D7A] p-[7px] shadow-sm">
        <span className="rounded-[2px] bg-white" />
        <span className="rounded-[2px] bg-white/55" />
        <span className="rounded-[2px] bg-white/55" />
        <span className="rounded-[2px] bg-white" />
      </div>
      {!compact && (
        <div>
          <p className="text-[17px] font-bold tracking-[-0.02em] text-[#162A2B]">
            SnappyForms
          </p>
          <p className="text-[10px] font-medium text-[#718080]">
            Volunteer verification
          </p>
        </div>
      )}
    </div>
  );
}

export function DemoSwitcher({
  view,
  setView,
}: {
  view: DemoView;
  setView: (view: DemoView) => void;
}) {
  return (
    <div
      aria-label="Preview view"
      className="inline-flex w-full rounded-lg border border-[#D6DCDA] bg-white p-1 shadow-sm sm:w-auto"
    >
      {(["portal", "volunteer"] as const).map((option) => (
        <button
          className={`flex-1 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-semibold transition sm:flex-none sm:px-3 ${
            view === option
              ? "bg-[#162A2B] text-white"
              : "text-[#5F6C6B] hover:bg-[#F2F4F2]"
          }`}
          key={option}
          onClick={() => setView(option)}
          type="button"
        >
          {option === "portal" ? "Organization portal" : "Volunteer form"}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export function QrPreview({ size = 132 }: { size?: number }) {
  const cells = useMemo(() => {
    const inFinder = (
      row: number,
      col: number,
      startRow: number,
      startCol: number,
    ) => {
      const y = row - startRow;
      const x = col - startCol;
      if (x < 0 || x > 6 || y < 0 || y > 6) return false;
      return (
        x === 0 ||
        x === 6 ||
        y === 0 ||
        y === 6 ||
        (x >= 2 && x <= 4 && y >= 2 && y <= 4)
      );
    };

    return Array.from({ length: 21 * 21 }, (_, index) => {
      const row = Math.floor(index / 21);
      const col = index % 21;
      const finder =
        inFinder(row, col, 0, 0) ||
        inFinder(row, col, 0, 14) ||
        inFinder(row, col, 14, 0);
      return finder || (row * 7 + col * 11 + row * col) % 5 < 2;
    });
  }, []);

  return (
    <svg
      aria-label="Preview QR code"
      className="rounded-lg bg-white p-2"
      height={size}
      role="img"
      viewBox="0 0 21 21"
      width={size}
    >
      {cells.map((filled, index) =>
        filled ? (
          <rect
            fill="#162A2B"
            height="1"
            key={index}
            width="1"
            x={index % 21}
            y={Math.floor(index / 21)}
          />
        ) : null,
      )}
    </svg>
  );
}

export function FormProgress({ step }: { step: number }) {
  return (
    <ol aria-label="Form progress" className="grid grid-cols-3">
      {["About you", "Service", "Review"].map((label, index) => {
        const number = index + 1;
        const complete = number < step;
        const active = number === step;
        return (
          <li className="relative text-center" key={label}>
            {index > 0 && (
              <span
                className={`absolute left-0 right-1/2 top-4 h-px ${number <= step ? "bg-[#3F6B58]" : "bg-[#D4DBD6]"}`}
              />
            )}
            {index < 2 && (
              <span
                className={`absolute left-1/2 right-0 top-4 h-px ${number < step ? "bg-[#3F6B58]" : "bg-[#D4DBD6]"}`}
              />
            )}
            <span
              className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${
                complete || active
                  ? "border-[#3F6B58] bg-[#3F6B58] text-white"
                  : "border-[#C9D2CD] bg-white text-[#72807D]"
              }`}
            >
              {complete ? <Check className="h-4 w-4" /> : number}
            </span>
            <span
              className={`mt-2 block text-[11px] font-semibold ${active ? "text-[#315F43]" : "text-[#7A8684]"}`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
