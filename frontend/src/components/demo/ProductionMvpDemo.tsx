"use client";

import { useState } from "react";
import { PrototypeBar } from "./DemoShared";
import PortalDemo from "./PortalDemo";
import VolunteerDemo from "./VolunteerDemo";
import { DemoView, initialSubmissions } from "./demoData";

export default function ProductionMvpDemo() {
  const [view, setView] = useState<DemoView>("portal");
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [resetKey, setResetKey] = useState(0);

  const reset = () => {
    setView("portal");
    setSubmissions(initialSubmissions);
    setResetKey((value) => value + 1);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#F5F6F3] text-[#162A2B]">
      <PrototypeBar onReset={reset} />
      {view === "portal" ? (
        <PortalDemo
          key={`portal-${resetKey}`}
          setSubmissions={setSubmissions}
          setView={setView}
          submissions={submissions}
          view={view}
        />
      ) : (
        <VolunteerDemo
          key={`volunteer-${resetKey}`}
          onSubmitted={() => undefined}
          setView={setView}
          view={view}
        />
      )}
    </div>
  );
}
