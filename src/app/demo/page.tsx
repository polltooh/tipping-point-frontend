import React from "react";
import Link from "next/link";

export default function DemoVideoPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#FAF9F6] p-4 sm:p-8">
      <div className="w-full max-w-[1140px] overflow-hidden rounded-2xl border border-[#E2E2DF] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDEDEA] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#171717] font-mono text-[11px] font-bold text-white">
              TP
            </span>
            <div>
              <h1 className="text-[15px] font-bold text-[#171717]">
                Tipping Point — Workflow Generation Screen Recording
              </h1>
              <p className="text-[12px] text-[#626262]">
                Home Page (Live Rolling News) → Ask Question → 2 Signals, 2 Triggers &amp; Multiple Platform Actions → 16-Venue Backtest
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/tipping_point_workflow_demo.mp4"
              download
              className="rounded-lg border border-[#DEDEDC] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#171717] hover:bg-[#F5F5F4]"
            >
              Download MP4
            </a>
            <Link
              href="/"
              className="rounded-lg bg-[#171717] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#2E2E2E]"
            >
              Open Live App →
            </Link>
          </div>
        </div>

        <div className="bg-black">
          <video
            controls
            autoPlay
            loop
            muted
            playsInline
            className="h-auto w-full"
          >
            <source src="/tipping_point_workflow_demo.mp4" type="video/mp4" />
            <source src="/tipping_point_workflow_demo.webm" type="video/webm" />
            Your browser does not support HTML5 video.
          </video>
        </div>
      </div>
    </div>
  );
}
