"use client";

import { useState } from "react";
import Link from "next/link";
import WalletBar from "../components/WalletBar";
import PoseRehabTracker, { type RepResult } from "../components/PoseRehabTracker";
import RecoveryCheckIn from "../components/RecoveryCheckIn";
import { type Language } from "@/lib/speech";

const EXERCISE_ID = "knee-flexion-day-3";
const TARGET_REPS = 10;

export default function DemoReactPage() {
  const [result, setResult] = useState<RepResult | null>(null);
  const [lang, setLang] = useState<Language>("vi");

  return (
    <main className="min-h-screen px-4 pb-16 bg-slate-50/50">
      <WalletBar />

      {/* Doctor Portal Quick Access Banner */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {lang === "vi"
                ? "Dành cho cơ sở y tế / Bác sĩ:"
                : "For Medical Clinics / Clinicians:"}
            </span>
            <span className="font-semibold text-slate-800 hidden sm:inline">
              {lang === "vi"
                ? "Quản lý phác đồ & Bằng chứng On-Chain"
                : "Protocol Roster & On-Chain Audit"}
            </span>
          </div>

          <Link
            href="/doctor"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition flex items-center gap-1 shadow-xs"
          >
            <span>{lang === "vi" ? "Cổng Bác Sĩ" : "Doctor Portal"}</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      <section className="max-w-2xl mx-auto text-center mb-6">
        <h1 className="text-3xl font-extrabold text-care-900 tracking-tight">
          CareProtocol
        </h1>
        <p className="text-gray-700 mt-2 text-sm sm:text-base">
          {lang === "vi" ? (
            <>
              Bài tập ngày 3 sau mổ: <b>Gập &amp; duỗi gối tại giường</b> — 10 lần,
              giúp phòng ngừa huyết khối tĩnh mạch sâu (DVT).
            </>
          ) : (
            <>
              Day 3 Post-op Exercise: <b>Bedside Knee Flexion &amp; Extension</b> — 10 reps,
              preventing Deep Vein Thrombosis (DVT).
            </>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1.5">
          {lang === "vi"
            ? "🔒 Camera chỉ xử lý cục bộ trên trình duyệt — không có video hay hình ảnh nào được tải lên máy chủ."
            : "🔒 Camera processes 100% locally on your browser — zero video or images ever leave your device."}
        </p>
      </section>

      <section className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6">
        {!result ? (
          <PoseRehabTracker
            targetReps={TARGET_REPS}
            onSessionComplete={setResult}
            lang={lang}
            onLangChange={setLang}
          />
        ) : (
          <RecoveryCheckIn
            exerciseId={EXERCISE_ID}
            result={result}
            onReset={() => setResult(null)}
            lang={lang}
          />
        )}
      </section>
    </main>
  );
}
