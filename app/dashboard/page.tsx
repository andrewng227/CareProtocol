"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  HeartPulse,
  Info,
  PhoneCall,
  Pill,
  Play,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";

export default function PostSurgeryDashboard() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [feeBreakdownOpen, setFeeBreakdownOpen] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(14391); // ~3h 59m 51s
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const toggleTask = (index: number) => {
    setCompletedTasks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const scrollToSection = (id: string, tabId: string) => {
    setActiveTab(tabId);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#CCFBF1] selection:text-[#042F2E]">
      
      {/* ================= HEADER / NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 space-y-2.5">
          
          {/* Top Row: Logo, Slogan & Clinician Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F766E] flex items-center justify-center text-white shadow-sm shadow-teal-900/20">
                <HeartPulse className="w-6 h-6 text-[#CCFBF1]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900">CareProtocol</span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CCFBF1] text-[#0F766E] border border-teal-200">
                    ERAS 2024
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Cộng hưởng chăm sóc &amp; Điều dưỡng hậu phẫu</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/doctor"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition"
              >
                <Stethoscope className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Cổng Bác Sĩ</span>
              </Link>

              <a
                href="/CareProtocol_GiaoDien.html"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F766E] hover:bg-[#0d6760] text-white shadow-xs transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Bản HTML Đầy Đủ</span>
              </a>
            </div>
          </div>

          {/* Quick Badges Row */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar text-xs">
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-[#0F766E] font-bold border border-teal-200/80">
                <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                <span>Chuẩn ERAS 2024</span>
              </span>

              <a
                href="tel:1900CARE"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 hover:bg-rose-100 transition"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <span>Cấp cứu 24/7</span>
              </a>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-medium border border-slate-200">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Bệnh nhân: Nguyễn Văn Hùng (52t)</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 font-mono font-bold border border-emerald-200">
                <span>Mã bệnh án: BA-2024-081</span>
              </span>
            </div>
          </div>

        </div>

        {/* Navigation Pills Bar */}
        <nav className="bg-slate-50/90 border-t border-slate-200/60 py-2">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold">
            <button
              onClick={() => scrollToSection("section-hero", "home")}
              className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "home" ? "bg-[#0F766E] text-white shadow-2xs" : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>🏠</span>
              <span>Trang chủ</span>
            </button>
            <button
              onClick={() => scrollToSection("section-nursing-timeline", "roadmap")}
              className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "roadmap" ? "bg-[#0F766E] text-white shadow-2xs" : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>📋</span>
              <span>Lộ trình phục hồi</span>
            </button>
            <button
              onClick={() => scrollToSection("section-npo", "npo")}
              className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "npo" ? "bg-[#0F766E] text-white shadow-2xs" : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>⏱️</span>
              <span>Đồng hồ NPO</span>
            </button>
            <a
              href="/CareProtocol_GiaoDien.html#prescription"
              className="px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 text-slate-600 hover:bg-white cursor-pointer"
            >
              <span>💊</span>
              <span>Sổ tay thuốc</span>
            </a>
            <button
              onClick={() => scrollToSection("section-hospital-fee", "fee")}
              className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "fee" ? "bg-[#0F766E] text-white shadow-2xs" : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>💰</span>
              <span>Báo cáo viện phí</span>
            </button>
            <button
              onClick={() => scrollToSection("section-red-flags", "contact")}
              className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "contact" ? "bg-[#0F766E] text-white shadow-2xs" : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>🚨</span>
              <span>Liên hệ y tế</span>
            </button>
          </div>
        </nav>
      </header>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* 1. HERO SECTION (BANNER CHÍNH) */}
        <section id="section-hero">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#042F2E] via-[#0b4845] to-[#0F766E] text-white p-7 sm:p-10 shadow-xl border border-teal-500/30 space-y-5">
            <div className="absolute -right-12 -bottom-12 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -top-12 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#CCFBF1]/20 text-[#CCFBF1] border border-[#CCFBF1]/40 text-xs font-bold shadow-2xs backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                <span>Hệ Thống Giám Sát Điều Dưỡng Số Chủ Động 24/7</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
                Đồng hành cùng bạn mỗi ngày sau phẫu thuật
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                CareProtocol đồng hành cùng bạn từ khi nhập viện, chuẩn bị trước mổ đến chăm sóc phục hồi từng mốc thời gian tại nhà.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="/CareProtocol_GiaoDien.html"
                  className="px-6 py-3.5 rounded-2xl bg-[#CCFBF1] hover:bg-white text-[#042F2E] font-black text-sm shadow-lg shadow-teal-950/30 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Bắt đầu hành trình hôm nay</span>
                  <span>→</span>
                </a>
                <button
                  onClick={() => scrollToSection("section-discharge", "discharge")}
                  className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-sm border border-white/30 backdrop-blur-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-300" />
                  <span>Dữ liệu y tế của bạn</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. QUICK STAT CARDS (4 CHỈ SỐ CỐT LÕI - GRID 4 CỘT) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 hover:border-teal-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 border-t-4 border-t-[#0F766E]">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Tốc độ phản hồi</p>
            <p className="text-xl sm:text-2xl font-black text-[#0F766E] mt-0.5 font-mono">Dưới 1 giây</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">Hỗ trợ AI giải đáp tức thì</p>
          </div>

          <div className="bg-white border border-slate-200/80 hover:border-emerald-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 border-t-4 border-t-[#14B8A6]">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0F766E] flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Chi phí minh bạch</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-0.5 font-mono">Gần như 0đ</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">Tối ưu hóa BHYT</p>
          </div>

          <div className="bg-white border border-slate-200/80 hover:border-cyan-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 border-t-4 border-t-[#06B6D4]">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Bảo mật dữ liệu</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">100% tại thiết bị</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">Bảo mật hồ sơ y khoa</p>
          </div>

          <div className="bg-white border border-slate-200/80 hover:border-amber-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 border-t-4 border-t-amber-500">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
              <Activity className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Độ chính xác lâm sàng</p>
            <p className="text-xl sm:text-2xl font-black text-amber-800 mt-0.5 font-mono">± 1 độ / 99.8%</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">Theo chuẩn ERAS</p>
          </div>
        </section>

        {/* 3. BẢN ĐỒ ĐIỀU HƯỚNG NHẬP VIỆN & BẢNG TÍNH VIỆN PHÍ MINH BẠCH */}
        <section id="section-hospital-fee" className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
                🏥
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Bản Đồ Điều Hướng Nhập Viện &amp; Bảng Tính Viện Phí Minh Bạch
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quy trình chuẩn hóa Hospital-First giúp người bệnh và thân nhân chủ động tài chính, loại bỏ 100% cảm giác bơ vơ.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shrink-0 self-start sm:self-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Chuẩn BHYT 2024
            </span>
          </div>

          {/* Quy trình 4 bước Stepper */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quy trình 4 bước hành trình nhập viện:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-2xl font-black text-slate-200 select-none">01</span>
                <span className="text-lg block mb-1">📋</span>
                <h3 className="font-bold text-sm text-slate-900">Bước 1: Tiếp nhận &amp; Phân tầng</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Quét mã CCCD/VssID, nhận diện mã bệnh nhân, phân luồng.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-2xl font-black text-slate-200 select-none">02</span>
                <span className="text-lg block mb-1">🩺</span>
                <h3 className="font-bold text-sm text-slate-900">Bước 2: Khám Chuyên khoa</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Bác sĩ chuyên khoa tiếp nhận, đánh giá tiền phẫu.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-2xl font-black text-slate-200 select-none">03</span>
                <span className="text-lg block mb-1">🔬</span>
                <h3 className="font-bold text-sm text-slate-900">Bước 3: Cận lâm sàng số hoá</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Chụp X-quang, xét nghiệm đồng bộ tự động lên EMR.
                </p>
              </div>

              <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-2xl font-black text-teal-200 select-none">04</span>
                <span className="text-lg block mb-1">💳</span>
                <h3 className="font-bold text-sm text-teal-950">Bước 4: Tạm ứng &amp; Nhận phòng</h3>
                <p className="text-xs text-teal-800 mt-1 leading-relaxed">
                  Nộp tạm ứng BHYT, kích hoạt vòng tay QR code &amp; app.
                </p>
              </div>
            </div>
          </div>

          {/* Bảng viện phí 3 dòng */}
          <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-teal-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-emerald-300">Bảng Tính Viện Phí Minh Bạch 3 Dòng</h3>
                  <p className="text-xs text-slate-300">Bệnh nhân: Nguyễn Văn Hùng (52t) • Mã bệnh án: BA-2024-081</p>
                </div>
              </div>
              <button
                onClick={() => setFeeBreakdownOpen(!feeBreakdownOpen)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-400/30 transition cursor-pointer"
              >
                {feeBreakdownOpen ? "▲ Thu Gọn" : "▼ Xem Chi Tiết Mục Kê"}
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-300 font-sans">1. Tổng chi phí phẫu thuật / điều trị:</span>
                <span className="font-bold text-white text-base">28.000.000 VNĐ</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-emerald-200 font-sans">2. Bảo hiểm y tế thanh toán (BHYT đúng tuyến chi trả 80% danh mục):</span>
                <span className="font-bold text-emerald-400 text-base">- 11.000.000 VNĐ</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-teal-500/10 border border-teal-500/30">
                <span className="text-teal-200 font-sans">3. Số tiền tạm ứng đã nộp khi nhập viện:</span>
                <span className="font-bold text-teal-300 text-base">- 10.000.000 VNĐ</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border-2 border-emerald-400/80">
                <div>
                  <span className="text-amber-300 font-bold font-sans text-sm sm:text-base block">
                    👉 Số tiền viện phí còn lại cần thanh toán khi xuất viện:
                  </span>
                  <span className="text-slate-300 text-xs font-sans">(Đã khấu trừ 100% tạm ứng &amp; phần BHYT thanh toán)</span>
                </div>
                <span className="font-black text-xl sm:text-2xl text-amber-300">7.000.000 VNĐ</span>
              </div>
            </div>

            {feeBreakdownOpen && (
              <div className="pt-3 border-t border-white/10 text-xs space-y-2 font-sans animate-fadeIn">
                <p className="font-bold text-emerald-300">Chi tiết các danh mục BHYT thanh toán:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  <div className="flex justify-between bg-black/30 p-2.5 rounded-lg">
                    <span>• Công phẫu thuật thay khớp:</span>
                    <b className="text-white">6.200.000đ</b>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2.5 rounded-lg">
                    <span>• Gây mê tủy sống &amp; hồi sức:</span>
                    <b className="text-white">1.800.000đ</b>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2.5 rounded-lg">
                    <span>• Kháng sinh &amp; Dược phẩm ERAS:</span>
                    <b className="text-white">1.150.000đ</b>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2.5 rounded-lg">
                    <span>• Thuốc chống đông Enoxaparin:</span>
                    <b className="text-white">620.000đ</b>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2.5 rounded-lg">
                    <span>• Giường bệnh hậu phẫu 4 ngày:</span>
                    <b className="text-white">1.230.000đ</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 4. ĐỒNG HỒ NHỊN ĂN UỐNG Y KHOA (NPO PROTOCOL - NIL PER OS) */}
        <section id="section-npo" className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
                ⏱️
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Đồng Hồ Nhịn Ăn Uống Y Khoa (NPO Protocol - Nil Per Os)
                </h2>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">
                  ⚠️ Cảnh báo an toàn phẫu thuật: Tránh nguy cơ sặc trào ngược khi gây mê.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Giờ mổ dự kiến: 14:00 hôm nay
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột 1: Thức ăn đặc / Sữa */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white flex items-center gap-1">
                  <span>🍞</span>
                  <span>Thức Ăn Đặc / Sữa</span>
                </span>
                <span className="text-xs font-bold text-rose-700 animate-pulse">⛔ BẮT ĐẦU NHỊN ĂN</span>
              </div>
              <div className="text-center py-2">
                <p className="text-xs text-amber-900 font-medium">Trạng thái NPO hiện tại:</p>
                <p className="text-2xl sm:text-3xl font-black text-rose-600 font-mono tracking-tight my-2">
                  ⛔ BẮT ĐẦU NHỊN ĂN
                </p>
                <p className="text-[11px] text-amber-800">Tuyệt đối cấm ăn cơm, bún, phở, sữa chua, cháo hạt.</p>
              </div>
              <div className="w-full bg-amber-200/80 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-600 h-full rounded-full w-full" />
              </div>
            </div>

            {/* Cột 2: Nước lọc / Nước đường trong */}
            <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white flex items-center gap-1">
                  <span>💧</span>
                  <span>Nước Lọc / Nước Đường Trong</span>
                </span>
                <span className="text-xs font-bold text-sky-800">Hạn cuối được uống ngụm nhỏ</span>
              </div>
              <div className="text-center py-2">
                <p className="text-xs text-sky-900 font-medium">Thời gian đếm ngược còn lại:</p>
                <p className="text-3xl sm:text-4xl font-black text-sky-950 font-mono tracking-tight my-1">
                  {formatCountdown(countdownSeconds)}
                </p>
                <p className="text-[11px] text-sky-800">Chỉ uống ngụm nhỏ &lt; 50ml nước lọc trong, không uống sữa.</p>
              </div>
              <div className="w-full bg-sky-200/80 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-600 h-full rounded-full transition-all duration-1000" style={{ width: "75%" }} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <p className="font-bold">Khuyến cáo chuẩn gây mê hồi sức quốc tế (ASA Guideline):</p>
              <p className="text-emerald-800 mt-0.5">
                Việc tuân thủ chặt chẽ NPO giúp dạ dày hoàn toàn rỗng lúc khởi mê, triệt tiêu 100% nguy cơ hít sặc dịch vị vào phế quản gây suy hô hấp cấp.
              </p>
            </div>
          </div>
        </section>

        {/* 5. LỘ TRÌNH ĐIỀU DƯỠNG SỐ CHỦ ĐỘNG 24/7 (HẬU PHẪU NGÀY 3) */}
        <section id="section-nursing-timeline" className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
                📋
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Lộ Trình Điều Dưỡng Số Chủ Động 24/7 (Hậu Phẫu Ngày 3)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lưới 6 thẻ nhiệm vụ phân ca (Sáng - Trưa - Chiều - Tối) được cá nhân hóa cho từng mốc phục hồi.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#0F766E] bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
              Đồng Bộ: BA-2024-081
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            {/* Ca 1 */}
            <div
              onClick={() => toggleTask(1)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 shadow-2xs ${
                completedTasks[1] ? "bg-emerald-50/80 border-emerald-300" : "bg-slate-50 border-slate-200/80 hover:border-teal-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded text-[11px]">06:00 - 08:00 (Sáng)</span>
                {completedTasks[1] && <span className="text-emerald-700 font-bold">✓ Đã xong</span>}
              </div>
              <p className="font-bold text-slate-900 text-sm">Khởi động ngày mới &amp; Chườm trọn</p>
              <p className="text-slate-600 leading-relaxed">Đo huyết áp, nhiệt độ, uống Paracetamol 500mg.</p>
            </div>

            {/* Ca 2 */}
            <div
              onClick={() => toggleTask(2)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 shadow-2xs ${
                completedTasks[2] ? "bg-emerald-50/80 border-emerald-300" : "bg-teal-50/60 border-teal-200 hover:border-teal-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded text-[11px]">09:00 - 10:30 (Sáng)</span>
                {completedTasks[2] && <span className="text-emerald-700 font-bold">✓ Đã xong</span>}
              </div>
              <p className="font-bold text-teal-950 text-sm">Phục hồi chức năng khớp bước 1</p>
              <p className="text-teal-800 leading-relaxed">Co duỗi khớp gối 45 độ, tập gồng cơ tứ đầu.</p>
            </div>

            {/* Ca 3 */}
            <div
              onClick={() => toggleTask(3)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 shadow-2xs ${
                completedTasks[3] ? "bg-emerald-50/80 border-emerald-300" : "bg-slate-50 border-slate-200/80 hover:border-teal-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded text-[11px]">11:30 - 13:00 (Trưa)</span>
                {completedTasks[3] && <span className="text-emerald-700 font-bold">✓ Đã xong</span>}
              </div>
              <p className="font-bold text-slate-900 text-sm">Dinh dưỡng phục hồi mô mềm</p>
              <p className="text-slate-600 leading-relaxed">Bữa trưa giàu đạm, bổ sung Vitamin C &amp; Collagen.</p>
            </div>

            {/* Ca 4 */}
            <div
              onClick={() => toggleTask(4)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 shadow-2xs ${
                completedTasks[4] ? "bg-emerald-50/80 border-emerald-300" : "bg-cyan-50/60 border-cyan-200 hover:border-cyan-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded text-[11px]">14:00 - 15:30 (Chiều)</span>
                {completedTasks[4] && <span className="text-emerald-700 font-bold">✓ Đã xong</span>}
              </div>
              <p className="font-bold text-cyan-950 text-sm">Chườm lạnh giảm đau &amp; phù nề</p>
              <p className="text-cyan-800 leading-relaxed">Chườm gel đá y tế 15 phút quanh khớp gối.</p>
            </div>

            {/* Ca 5 */}
            <div
              onClick={() => toggleTask(5)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 shadow-2xs ${
                completedTasks[5] ? "bg-emerald-50/80 border-emerald-300" : "bg-teal-50/60 border-teal-200 hover:border-teal-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded text-[11px]">16:30 - 17:30 (Chiều)</span>
                {completedTasks[5] && <span className="text-emerald-700 font-bold">✓ Đã xong</span>}
              </div>
              <p className="font-bold text-teal-950 text-sm">Phục hồi chức năng khớp bước 2</p>
              <p className="text-teal-800 leading-relaxed">Tập đi bộ với khung hỗ trợ, chống DVT huyết khối.</p>
            </div>

            {/* Ca 6 */}
            <div
              onClick={() => toggleTask(6)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 shadow-2xs ${
                completedTasks[6] ? "bg-emerald-50/80 border-emerald-300" : "bg-indigo-50/60 border-indigo-200 hover:border-indigo-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded text-[11px]">19:30 - 21:00 (Tối)</span>
                {completedTasks[6] && <span className="text-emerald-700 font-bold">✓ Đã xong</span>}
              </div>
              <p className="font-bold text-indigo-950 text-sm">Tư thế ngủ gác chân &amp; thư giãn</p>
              <p className="text-indigo-800 leading-relaxed">Kê chân cao 15-20cm, theo dõi nhiệt độ trước ngủ.</p>
            </div>
          </div>
        </section>

        {/* 6. BỘ LỌC CỜ ĐỎ CẤP CỨU (5 DẤU HIỆU PHẢI BÁO VIỆN NGAY) */}
        <section id="section-red-flags" className="bg-red-50/90 border-2 border-red-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0 animate-pulse">
                🚨
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-red-950 leading-tight">
                  Bộ Lọc Cờ Đỏ Cấp Cứu (5 Dấu Hiệu Phải Báo Viện Ngay)
                </h2>
                <p className="text-xs text-red-800 mt-0.5">
                  Khi xuất hiện bất kỳ dấu hiệu cảnh báo nào dưới đây, lập tức gọi điện đến hotline viện!
                </p>
              </div>
            </div>
            <a
              href="tel:1900CARE"
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer animate-bounce"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Hotline Cấp Cứu 1900-CARE</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-red-200 space-y-1.5 shadow-2xs">
              <span className="text-red-700 font-black text-sm block">🚩 1. Sốt cao &gt; 38.5°C</span>
              <p className="text-slate-700 leading-relaxed">Sốt cao &gt; 38.5°C liên tục uống hạ sốt không giảm.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-red-200 space-y-1.5 shadow-2xs">
              <span className="text-red-700 font-black text-sm block">🚩 2. Rỉ dịch mủ hoặc máu</span>
              <p className="text-slate-700 leading-relaxed">Rỉ dịch mủ hoặc máu tươi ướt đẫm băng gạc vết mổ.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-red-200 space-y-1.5 shadow-2xs">
              <span className="text-red-700 font-black text-sm block">🚩 3. Đau bắp chân, sưng đỏ</span>
              <p className="text-slate-700 leading-relaxed">Đau bắp chân, sưng nóng đỏ một bên chân (Nghi ngờ huyết khối DVT).</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-red-200 space-y-1.5 shadow-2xs">
              <span className="text-red-700 font-black text-sm block">🚩 4. Cơn đau dữ dội VAS 7-8</span>
              <p className="text-slate-700 leading-relaxed">Cơn đau dữ dội vượt ngưỡng VAS 7-8 dù đã dùng thuốc.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-red-200 space-y-1.5 shadow-2xs">
              <span className="text-red-700 font-black text-sm block">🚩 5. Tê liệt mất cảm giác</span>
              <p className="text-slate-700 leading-relaxed">Tê liệt, mất cảm giác hoặc lạnh tái đầu chi.</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-1.5 shadow-2xs flex flex-col justify-center">
              <span className="text-emerald-900 font-bold text-sm block">💬 Trợ Lý AI CareProtocol 24/7</span>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                Bạn có thể nhắn tin hỏi trực tiếp để nhận hướng dẫn lâm sàng sơ bộ ngay lập tức.
              </p>
            </div>
          </div>
        </section>

        {/* 7. DANH MỤC CHỨNG TỪ XUẤT VIỆN & LỊCH HẸN TÁI KHÁM VÀNG */}
        <section id="section-discharge" className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
                📜
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Danh Mục Chứng Từ Xuất Viện &amp; Lịch Hẹn Tái Khám Vàng
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hồ sơ chứng từ pháp lý và các mốc theo dõi vàng bảo đảm liền xương vững chắc.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileCheck className="w-4 h-4 text-[#0F766E]" />
              <span>In Bản Báo Cáo A4</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột Trái: Danh mục chứng từ */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-700" />
                <span>Danh mục chứng từ bắt buộc:</span>
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <p className="font-bold text-slate-900">Giấy ra viện bản gốc</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Có chữ ký Giám đốc viện và dấu mộc tròn đỏ để nộp thanh toán bảo hiểm xã hội.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <p className="font-bold text-slate-900">Giấy chứng nhận phẫu thuật</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ghi rõ mã kỹ thuật phẫu thuật thay toàn bộ khớp gối TKA và số hiệu sê-ri khớp nhân tạo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <p className="font-bold text-slate-900">Đơn thuốc ngoại trú 14 ngày</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Được số hóa sẵn trong tab &quot;Đơn thuốc&quot;, có tính năng nhắc giờ uống tự động.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột Phải: Các mốc khám vàng */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3">
              <p className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-800" />
                <span>Các mốc khám vàng quan trọng:</span>
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-teal-200">
                  <span className="text-xl">✂️</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-teal-950">Mốc 1 (Ngày 12 sau mổ): Tái khám &amp; Cắt chỉ vết mổ</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">Bắt buộc</span>
                    </div>
                    <p className="text-[11px] text-teal-800 mt-1 leading-relaxed">
                      Bác sĩ kiểm tra liền da mép mổ, tháo chỉ khâu hoặc rút ghim kim loại. Đánh giá khả năng tự đi lại với khung tập.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-teal-200">
                  <span className="text-xl">🩻</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-teal-950">Mốc 2 (Ngày 28 sau mổ): Chụp X-quang kiểm tra liền xương &amp; phục hồi tầm vận động</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">Quan trọng</span>
                    </div>
                    <p className="text-[11px] text-teal-800 mt-1 leading-relaxed">
                      Chụp X-quang đối chiếu độ liền xương xung quanh chân khớp nhân tạo. Đo biên độ gập duỗi đạt mốc 110°.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

    </div>
  );
}
