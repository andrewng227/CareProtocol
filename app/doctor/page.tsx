"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MOCK_PATIENTS,
  CLINICAL_GUIDELINES_SOURCES,
  type PatientRecord,
} from "@/lib/clinicalData";
import { type Language } from "@/lib/speech";

interface ClinicalStudy {
  id: string;
  title: string;
  source: string;
  pubDate: string;
  url: string;
  type: "pubmed" | "clinicaltrial";
}

interface WgerExercise {
  id: number;
  name: string;
  category: string;
  description: string;
  muscles: string[];
}

export default function DoctorDashboardPage() {
  const [lang, setLang] = useState<Language>("vi");
  const [activeTab, setActiveTab] = useState<"patients" | "evidence">("patients");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(
    MOCK_PATIENTS[0]
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Live NIH PubMed & wger API State
  const [liveQuery, setLiveQuery] = useState("knee arthroplasty rehabilitation");
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [liveStudies, setLiveStudies] = useState<ClinicalStudy[]>([]);
  const [liveExercises, setLiveExercises] = useState<WgerExercise[]>([]);
  const [apiKeysStatus, setApiKeysStatus] = useState<{
    ncbi: boolean;
    wger: boolean;
  }>({ ncbi: true, wger: true });

  const fetchLiveGuidelines = async (queryToFetch: string) => {
    setIsLoadingLive(true);
    try {
      const res = await fetch(`/api/clinical?query=${encodeURIComponent(queryToFetch)}`);
      const data = await res.json();
      if (data.success) {
        if (data.studies) setLiveStudies(data.studies);
        if (data.exercises) setLiveExercises(data.exercises);
        if (data.apiKeys) setApiKeysStatus(data.apiKeys);
      }
    } catch (e) {
      console.error("Failed to fetch live studies:", e);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    if (activeTab === "evidence" && liveStudies.length === 0) {
      fetchLiveGuidelines(liveQuery);
    }
  }, [activeTab]);

  const filteredPatients = MOCK_PATIENTS.filter((p) => {
    if (filterStatus === "all") return true;
    return p.compliance.status === filterStatus;
  });

  const totalPatients = MOCK_PATIENTS.length;
  const criticalCount = MOCK_PATIENTS.filter(
    (p) => p.compliance.status === "critical"
  ).length;
  const compliantCount = MOCK_PATIENTS.filter(
    (p) => p.compliance.status === "compliant"
  ).length;
  const avgQuality = Math.round(
    MOCK_PATIENTS.reduce((sum, p) => sum + p.compliance.formQualityAverage, 0) /
      totalPatients
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-care-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              CP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">
                  {lang === "vi"
                    ? "Cổng Bác Sĩ & Điều Dưỡng"
                    : "Clinician & Nursing Portal"}
                </h1>
                <span className="bg-care-100 text-care-800 text-xs px-2 py-0.5 rounded-full font-semibold border border-care-200">
                  RTM Pro
                </span>
              </div>
              <p className="text-xs text-slate-500">
                CareProtocol — Remote Therapeutic Monitoring &amp; On-Chain Audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setLang("vi")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  lang === "vi"
                    ? "bg-white text-care-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🇻🇳 Tiếng Việt
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  lang === "en"
                    ? "bg-white text-care-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🇺🇸 English
              </button>
            </div>

            {/* Link back to Patient Exercise app */}
            <Link
              href="/"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-care-50 text-care-700 border border-care-200 hover:bg-care-100 transition"
            >
              ← {lang === "vi" ? "Chế độ Bệnh nhân" : "Patient Mode"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">
              {lang === "vi" ? "Tổng bệnh nhân theo dõi" : "Active Monitored Patients"}
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalPatients}</p>
            <p className="text-xs text-care-600 mt-1">100% Client AI Camera</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">
              {lang === "vi" ? "Tuân thủ tốt (Streak ≥ 3d)" : "High Compliance Rate"}
            </p>
            <p className="text-2xl font-bold text-care-600 mt-1">
              {Math.round((compliantCount / totalPatients) * 100)}%
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {compliantCount}/{totalPatients} {lang === "vi" ? "bệnh nhân" : "patients"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/30 shadow-xs">
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              {lang === "vi" ? "Cảnh báo đỏ (Bỏ tập ≥ 2d)" : "Red-flag Alerts (Missed ≥ 2d)"}
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">{criticalCount}</p>
            <p className="text-xs text-red-500 mt-1">
              {lang === "vi" ? "Cần điều dưỡng gọi điện" : "Nurse call required"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">
              {lang === "vi" ? "Chất lượng tư thế TB" : "Avg Form Quality"}
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{avgQuality}%</p>
            <p className="text-xs text-slate-400 mt-1">
              {lang === "vi" ? "Đo từ góc gối MediaPipe" : "Calculated via MediaPipe"}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab("patients")}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "patients"
                ? "border-care-600 text-care-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            📋 {lang === "vi" ? "Danh Sách Bệnh Nhân & Tiến Độ" : "Patient Roster & Adherence"}
          </button>
          <button
            onClick={() => setActiveTab("evidence")}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "evidence"
                ? "border-care-600 text-care-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            📚 {lang === "vi" ? "Cơ Sở Dữ Liệu & API Chuẩn Y Khoa" : "Clinical APIs & Evidence Base"}
          </button>
        </div>

        {/* TAB 1: PATIENT ROSTER */}
        {activeTab === "patients" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Patient List (Left / 7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  {lang === "vi" ? "Hồ Sơ Hậu Phẫu Đang Quản Lý" : "Post-op Patients List"}
                </h2>

                <div className="flex gap-1 text-xs">
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      filterStatus === "all"
                        ? "bg-slate-800 text-white"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    {lang === "vi" ? "Tất cả" : "All"}
                  </button>
                  <button
                    onClick={() => setFilterStatus("critical")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      filterStatus === "critical"
                        ? "bg-red-600 text-white"
                        : "bg-white text-red-600 border border-red-200"
                    }`}
                  >
                    {lang === "vi" ? "Cảnh báo đỏ" : "Critical"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredPatients.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  const statusBg =
                    p.compliance.status === "compliant"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : p.compliance.status === "warning"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200";

                  const statusLabel =
                    p.compliance.status === "compliant"
                      ? lang === "vi"
                        ? "Đạt chuẩn"
                        : "Compliant"
                      : p.compliance.status === "warning"
                      ? lang === "vi"
                        ? "Chú ý (Trễ 1 ngày)"
                        : "Warning (1d miss)"
                      : lang === "vi"
                      ? "Nguy cơ bỏ phác đồ"
                      : "Critical Alert (≥2d miss)";

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className={`p-4 rounded-2xl bg-white border cursor-pointer transition shadow-xs hover:border-care-400 ${
                        isSelected
                          ? "border-care-600 ring-2 ring-care-500/20"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-base">
                              {p.name}
                            </h3>
                            <span className="text-xs text-slate-400 font-mono">
                              #{p.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {lang === "vi" ? p.surgery.typeVi : p.surgery.typeEn} •{" "}
                            <span className="font-semibold text-slate-700">
                              {lang === "vi"
                                ? `Hậu phẫu ngày ${p.surgery.daysPostOp}`
                                : `Day ${p.surgery.daysPostOp} Post-op`}
                            </span>
                          </p>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusBg}`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block">
                            {lang === "vi" ? "Góc gập (ROM)" : "Max ROM"}
                          </span>
                          <span className="font-bold text-slate-700 text-sm">
                            {p.latestSession?.achievedRom ?? 0}° /{" "}
                            {p.protocol.targetRomDegrees}°
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">
                            {lang === "vi" ? "Chất lượng tư thế" : "Form Quality"}
                          </span>
                          <span className="font-bold text-slate-700 text-sm">
                            {p.compliance.formQualityAverage}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">
                            {lang === "vi" ? "Xác thực Solana" : "On-chain Audit"}
                          </span>
                          <span className="text-care-600 font-mono text-[11px] font-semibold">
                            {p.latestSession?.txSignature
                              ? "✓ Verified"
                              : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Patient Detail Panel (Right / 5 cols) */}
            <div className="lg:col-span-5">
              {selectedPatient ? (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-20">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs text-care-600 font-bold uppercase tracking-wider">
                        {lang === "vi" ? "Chi Tiết Ca Điều Trị" : "Clinical Case File"}
                      </span>
                      <h2 className="text-lg font-bold text-slate-800">
                        {selectedPatient.name}
                      </h2>
                    </div>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                      {selectedPatient.id}
                    </span>
                  </div>

                  {/* Surgery & Doctor Info */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">
                        {lang === "vi" ? "Bác sĩ phẫu thuật" : "Primary Surgeon"}:
                      </span>
                      <span className="font-semibold text-slate-700">
                        {selectedPatient.surgery.surgeon}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">
                        {lang === "vi" ? "Bệnh viện" : "Medical Facility"}:
                      </span>
                      <span className="font-semibold text-slate-700">
                        {selectedPatient.surgery.hospital}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">
                        {lang === "vi" ? "Phác đồ chỉ định" : "Clinical Protocol"}:
                      </span>
                      <span className="font-semibold text-care-700 text-right max-w-[200px]">
                        {lang === "vi"
                          ? selectedPatient.protocol.nameVi
                          : selectedPatient.protocol.nameEn}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">
                        {lang === "vi" ? "Mục tiêu lâm sàng" : "Clinical Goal"}:
                      </span>
                      <span className="font-medium text-slate-600 text-right max-w-[220px]">
                        {lang === "vi"
                          ? selectedPatient.protocol.currentStageVi
                          : selectedPatient.protocol.currentStageEn}
                      </span>
                    </div>
                  </div>

                  {/* ROM Progress History (Biểu đồ tiến độ góc gối) */}
                  <div className="mt-5">
                    <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                      {lang === "vi"
                        ? "Tiến Trình Cải Thiện Góc Gối (ROM Trend)"
                        : "Range of Motion (ROM) Improvement"}
                    </h3>

                    <div className="space-y-2">
                      {selectedPatient.history.map((h, i) => {
                        const target = selectedPatient.protocol.targetRomDegrees;
                        const pct = Math.min(100, Math.round((h.rom / target) * 100));
                        return (
                          <div key={i} className="text-xs">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium text-slate-600">
                                {h.day}
                              </span>
                              <span className="font-semibold text-slate-800">
                                {h.rom > 0 ? `${h.rom}° (${pct}%)` : lang === "vi" ? "Bỏ buổi tập" : "Missed"}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  h.rom > 0 ? "bg-care-500" : "bg-red-400"
                                }`}
                                style={{ width: `${h.rom > 0 ? pct : 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Doctor Notes & Actions */}
                  <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <p className="font-bold text-slate-700 mb-1">
                      📝 {lang === "vi" ? "Ghi Chú Lâm Sàng" : "Clinical Notes"}
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedPatient.notes}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() =>
                        alert(
                          lang === "vi"
                            ? `Đã gửi tin nhắn nhắc nhở và kích hoạt cuộc gọi điều dưỡng tới bệnh nhân ${selectedPatient.name}`
                            : `Reminder notification and nursing call triggered for ${selectedPatient.name}`
                        )
                      }
                      className="flex-1 py-2 rounded-xl bg-care-600 hover:bg-care-700 text-white font-semibold text-xs transition shadow-xs"
                    >
                      📞 {lang === "vi" ? "Liên Hệ Bệnh Nhân" : "Call Patient"}
                    </button>
                    <button
                      onClick={() =>
                        alert(
                          lang === "vi"
                            ? "Đã lưu bản ghi kiểm toán tuân thủ điều trị vào EMR bệnh viện."
                            : "Compliance audit record synchronized to hospital EHR."
                        )
                      }
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                    >
                      💾 EMR Sync
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 2: CLINICAL EVIDENCE & LIVE APIS */}
        {activeTab === "evidence" && (
          <div className="space-y-6">
            {/* Live API Console: NIH PubMed + wger */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">
                    🔬 {lang === "vi" ? "Tra Cứu Trực Tiếp Từ NIH PubMed & wger API" : "Live NIH PubMed & wger Exercises API"}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-emerald-50 text-emerald-700 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                    {apiKeysStatus.ncbi ? "✓ NCBI Key Active (10 req/s)" : "Public Rate"}
                  </span>
                  <span className="bg-purple-50 text-purple-700 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">
                    {apiKeysStatus.wger ? "✓ wger API Token Active" : "wger Free"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-4">
                {lang === "vi"
                  ? "Truy vấn thời gian thực các bài báo khoa học (NIH) và thư viện bài tập phục hồi chức năng chân/khớp gối (wger API):"
                  : "Query peer-reviewed clinical studies (NIH) and open-source rehabilitation exercise database (wger API) in real-time:"}
              </p>

              {/* Search Box & Quick Filter Pills */}
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  value={liveQuery}
                  onChange={(e) => setLiveQuery(e.target.value)}
                  placeholder="Nhập từ khóa y khoa (vd: total knee arthroplasty rehabilitation)..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-care-500"
                />
                <button
                  onClick={() => fetchLiveGuidelines(liveQuery)}
                  disabled={isLoadingLive}
                  className="px-5 py-2 rounded-xl bg-care-600 hover:bg-care-700 text-white text-sm font-semibold transition disabled:opacity-50 shadow-xs"
                >
                  {isLoadingLive ? (lang === "vi" ? "Đang tải…" : "Fetching…") : (lang === "vi" ? "Tìm Kiếm" : "Search APIs")}
                </button>
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-6">
                <span className="text-slate-400 font-medium py-1">Gợi ý nhanh:</span>
                {[
                  "knee arthroplasty rehabilitation",
                  "ACL reconstruction exercise protocol",
                  "bedside deep vein thrombosis prophylaxis",
                  "patella fracture range of motion",
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setLiveQuery(tag);
                      fetchLiveGuidelines(tag);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* SECTION A: NIH STUDIES */}
              <div className="border-t border-slate-100 pt-4 mb-6">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                  📄 {lang === "vi" ? "Tài Liệu Y Học Lâm Sàng (NIH PubMed / ClinicalTrials)" : "Clinical Research Papers (NIH PubMed)"}
                </h3>
                <div className="space-y-2.5">
                  {isLoadingLive ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      ⏳ Đang tải dữ liệu từ NIH và wger…
                    </div>
                  ) : liveStudies.length > 0 ? (
                    liveStudies.map((study) => (
                      <div
                        key={study.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                study.type === "pubmed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {study.type === "pubmed" ? "PubMed Central" : "ClinicalTrials.gov"}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {study.id}
                            </span>
                            <span className="text-xs text-slate-400">• {study.pubDate}</span>
                          </div>
                          <h4 className="font-semibold text-slate-800 text-sm">
                            {study.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{study.source}</p>
                        </div>

                        <a
                          href={study.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-care-600 hover:text-care-800 underline shrink-0"
                        >
                          {lang === "vi" ? "Đọc bài báo gốc →" : "Read Study →"}
                        </a>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>

              {/* SECTION B: WGER REHAB EXERCISES */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                  🏋️ {lang === "vi" ? "Thư Viện Bài Tập Vận Động Khớp Gối (wger Open API)" : "Rehab Exercise Library (wger Open API)"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {liveExercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          {ex.category}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-2">
                          {ex.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {ex.description}
                        </p>
                      </div>
                      {ex.muscles.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                          Nhóm cơ: <span className="text-slate-600 font-medium">{ex.muscles.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* General Guidelines & Standards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CLINICAL_GUIDELINES_SOURCES.map((source, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {source.evidenceLevel}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {source.organization}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">
                      {source.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {lang === "vi" ? source.descriptionVi : source.descriptionEn}
                    </p>
                  </div>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-care-600 hover:text-care-800 flex items-center gap-1 transition"
                  >
                    <span>{lang === "vi" ? "Xem tài liệu API / Guideline chính thức" : "Visit Official API / Guideline"}</span>
                    <span>→</span>
                  </a>
                </div>
              ))}
            </div>

            {/* Clinical Integration Architecture Box */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-care-400 mb-2">
                HL7 FHIR &amp; RTM Insurance Audit Architecture
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {lang === "vi"
                  ? "Dữ liệu phục hồi được chuẩn hóa sang tài nguyên FHIR `Observation` và `CarePlan`, sau đó hash SHA-256 để ghi vào Solana SPL Memo. Khi kiểm toán viên bảo hiểm yêu cầu đối soát, họ có thể giải mã và so khớp hash trực tiếp mà không cần truy cập vào hình ảnh riêng tư của bệnh nhân."
                  : "Rehabilitation metrics are transformed into HL7 FHIR `Observation` & `CarePlan` objects, hashed via SHA-256, and published to Solana SPL Memo. Insurance auditors verify adherence without exposing patient camera streams."}
              </p>

              <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-care-300 overflow-x-auto border border-slate-800">
                {`{
  "resourceType": "Observation",
  "status": "final",
  "category": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "therapy" }] }],
  "code": { "coding": [{ "system": "http://loinc.org", "code": "80327-0", "display": "Range of motion knee flexion" }] },
  "subject": { "reference": "Patient/BN-2026-081" },
  "effectiveDateTime": "2026-09-19T22:00:00Z",
  "valueQuantity": { "value": 92, "unit": "deg", "system": "http://unitsofmeasure.org" },
  "component": [
    { "code": { "text": "FormQualityScore" }, "valueInteger": 90 },
    { "code": { "text": "SolanaAuditTx" }, "valueString": "5KtPn...X9a8B" }
  ]
}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
