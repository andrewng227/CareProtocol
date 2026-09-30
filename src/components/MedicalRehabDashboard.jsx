import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Camera, 
  CameraOff, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  Terminal, 
  User, 
  Flame, 
  Clock, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function MedicalRehabDashboard() {
  // State quản lý bài tập & bệnh án
  const [selectedPatient, setSelectedPatient] = useState('tka-nguyen-van-a');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(true);
  const [repCount, setRepCount] = useState(0);
  const targetReps = 10;
  const [currentAngle, setCurrentAngle] = useState(72);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStage, setActiveStage] = useState('flexing'); // flexing | extending | idle
  const [logs, setLogs] = useState([
    { id: 1, time: '08:00:12', type: 'info', msg: 'Khởi tạo hệ thống AI Pose Tracking v2.6.4 thành công.' },
    { id: 2, time: '08:00:15', type: 'success', msg: 'Đã tải phác đồ TKA Heel Slides (Ngưỡng an toàn < 90°).' },
    { id: 3, time: '08:00:22', type: 'warning', msg: 'Cảnh báo lâm sàng: Chống gập vượt 90° tránh căng bao khớp.' }
  ]);

  const canvasRef = useRef(null);

  // Danh sách bệnh án mẫu
  const patients = [
    { id: 'tka-nguyen-van-a', name: 'Nguyễn Văn An (62t) - Thay khớp gối toàn phần (TKA)', day: 'D+5 Hậu phẫu' },
    { id: 'acl-tran-thi-b', name: 'Trần Thị Bích (28t) - Tái tạo dây chằng chéo trước (ACL)', day: 'D+12 Hậu phẫu' },
    { id: 'hip-le-van-c', name: 'Lê Văn Cường (55t) - Thay khớp háng bán phần', day: 'D+3 Hậu phẫu' }
  ];

  // Thêm log mới
  const addLog = (msg, type = 'info') => {
    const time = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [{ id: Date.now(), time, type, msg }, ...prev.slice(0, 15)]);
  };

  // Giả lập chuyển động góc và đếm rep (Autopilot / Demo Mode)
  useEffect(() => {
    let interval = null;
    if (isSimulating) {
      let angle = currentAngle;
      let direction = 1;
      interval = setInterval(() => {
        if (direction === 1) {
          angle += 2;
          if (angle >= 86) {
            direction = -1;
            setActiveStage('flexing');
          }
        } else {
          angle -= 2;
          if (angle <= 25) {
            direction = 1;
            setActiveStage('extending');
            setRepCount(prev => {
              const next = prev + 1;
              addLog(`🎉 Hoàn thành Rep #${next} chuẩn xác (Góc gập cực đại: 86°)!`, 'success');
              return next >= targetReps ? targetReps : next;
            });
          }
        }
        setCurrentAngle(angle);
      }, 70);
    }
    return () => clearInterval(interval);
  }, [isSimulating, currentAngle]);

  // Vẽ Skeleton & HUD lên Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Điểm tọa độ khung xương chân giả lập
    const hip = { x: width * 0.35, y: height * 0.45 };
    const knee = { x: width * 0.52, y: height * 0.38 + (currentAngle * 0.8) };
    const ankle = { x: width * 0.72, y: height * 0.78 };

    // 1. Vẽ xương đùi (Femur)
    ctx.save();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(knee.x, knee.y);
    ctx.stroke();

    // 2. Vẽ xương chày (Tibia) - Màu xanh lá dạ quang (Emerald Glow)
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(knee.x, knee.y);
    ctx.lineTo(ankle.x, ankle.y);
    ctx.stroke();
    ctx.restore();

    // 3. Vẽ các khớp (Joint Nodes)
    [hip, knee, ankle].forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, idx === 1 ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = idx === 1 ? '#00ff88' : '#38bdf8';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, idx === 1 ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

    // 4. Vẽ cung đo góc khớp gối
    ctx.save();
    ctx.beginPath();
    ctx.arc(knee.x, knee.y, 28, 0, (currentAngle * Math.PI) / 180);
    ctx.strokeStyle = currentAngle > 90 ? '#f43f5e' : '#00ff88';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 5. Target Reticle ở đầu gối
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(knee.x, knee.y, 45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

  }, [currentAngle]);

  const progressPercent = Math.min(100, Math.round((repCount / targetReps) * 100));

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 font-sans p-4 flex flex-col gap-3 overflow-hidden select-none">
      
      {/* =========================================================================
          PHẦN 1: HEADER & BANNER TRÊN CÙNG (Dark Mode Slate-950/900 + Emerald Accent)
          ========================================================================= */}
      <header className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-md shrink-0 flex flex-col gap-2.5">
        
        {/* Top Navbar Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  CareProtocol <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">AI Rehab</span>
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs text-slate-400 font-medium">Kinematics Engine v2.6</span>
              </div>
              <p className="text-[11px] text-slate-400">Phục hồi chức năng chuẩn y tế thông minh & Bác sĩ đồng hành</p>
            </div>
          </div>

          {/* Danh sách chọn bệnh án (Dropdown EMR) */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Bệnh án:</span>
              <div className="relative">
                <select 
                  value={selectedPatient} 
                  onChange={(e) => {
                    setSelectedPatient(e.target.value);
                    addLog(`Đã chuyển bệnh án sang: ${e.target.value}`);
                  }}
                  className="bg-transparent text-emerald-300 font-semibold pr-6 focus:outline-none cursor-pointer appearance-none"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name} ({p.day})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chuẩn Bộ Y Tế & ASA</span>
            </div>
          </div>
        </div>

        {/* Banner Bài tập chính & Thẻ lưu ý biên độ */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-emerald-950/40 via-slate-950/60 to-slate-900/60 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Co duỗi gối trượt gót nhẹ nhàng tại giường (Bed Heel Slide - TKA)
                </h2>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded text-[10px] font-mono font-semibold">
                  Mục tiêu: 10 reps / hiệp
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Kích hoạt cơ tứ đầu đùi, phục hồi tuần hoàn khớp gối và chống đông cứng bao khớp.
              </p>
            </div>
          </div>

          {/* Thẻ lưu ý biên độ an toàn (< 90 độ) */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold shadow-sm animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>NGƯỠNG AN TOÀN: GÓC GẬP &lt; 90° (TRÁNH CĂNG BỤC VẾT MỔ)</span>
          </div>
        </div>

      </header>


      {/* =========================================================================
          PHẦN 2: PHẦN THÂN GRID 2 CỘT (Cột trái 68% - Cột phải 32%)
          ========================================================================= */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        
        {/* ==================== CỘT TRÁI (68%): VIDEO / CAMERA & HUD & PIP ==================== */}
        <section className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden shadow-2xl backdrop-blur-sm">
          
          {/* Top Camera Controls Bar */}
          <div className="flex items-center justify-between mb-2 z-20">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCameraActive || isSimulating ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCameraActive || isSimulating ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
              </span>
              <span className="text-xs font-bold text-slate-200">
                {isCameraActive ? 'AI Camera: Live Stream (30 FPS)' : isSimulating ? 'AI Simulator: Active' : 'Camera: Sẵn sàng'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700">
                MediaPipe 33 Landmark
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => {
                  setIsSimulating(!isSimulating);
                  addLog(isSimulating ? 'Dừng mô phỏng chuyển động.' : 'Bật chế độ mô phỏng Autopilot.', isSimulating ? 'info' : 'success');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${isSimulating ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Dừng Mô Phỏng' : 'Mô Phỏng Demo'}</span>
              </button>

              <button 
                onClick={() => {
                  setIsVoiceActive(!isVoiceActive);
                  addLog(isVoiceActive ? 'Tắt giọng nói hướng dẫn.' : 'Bật huấn luyện viên giọng nói AI.');
                }}
                className={`p-1.5 rounded-lg border transition ${isVoiceActive ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-slate-800/50 text-slate-500 border-slate-800'}`}
                title="Bật/Tắt giọng nói"
              >
                {isVoiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Viewport Khung Video/Camera + Overlay HUD Canvas */}
          <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center min-h-[340px]">
            
            {/* Background Grid Hi-tech */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            {/* Canvas vẽ các điểm xương dạ quang */}
            <canvas 
              ref={canvasRef} 
              width={640} 
              height={440} 
              className="w-full h-full object-cover"
            />

            {/* Badge đo góc hiển thị '72°' trực diện trên video */}
            <div className="absolute top-4 left-4 z-20 bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-black text-xl border border-emerald-500/30">
                {currentAngle}°
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Góc Khớp Gối (ROM)</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {currentAngle <= 90 ? 'Vùng An Toàn (<90°)' : 'Cảnh Báo Quá Ngưỡng'}
                </div>
              </div>
            </div>

            {/* Stage Indicator Overlay */}
            <div className="absolute top-4 right-4 z-20 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-300">
              Trạng thái: <span className="text-emerald-400 font-bold uppercase">{activeStage === 'flexing' ? 'Đang co gập' : 'Đang duỗi gót'}</span>
            </div>

            {/* PIP Video (Picture-in-Picture) Bác sĩ tập mẫu góc dưới bên phải */}
            <div className="absolute bottom-3 right-3 w-48 sm:w-56 aspect-[16/10] bg-slate-900/95 border-2 border-emerald-500/40 rounded-xl shadow-2xl overflow-hidden z-30 flex flex-col">
              <div className="bg-slate-950/90 px-2 py-1 flex items-center justify-between border-b border-slate-800 text-[10px]">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-emerald-400" /> Video Bác Sĩ Mẫu
                </span>
                <span className="text-slate-400 font-mono">00:45</span>
              </div>
              <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-2 text-center">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&auto=format&fit=crop&q=80" 
                  alt="Doctor Demo" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                <div className="relative z-10 text-[11px] font-semibold text-white drop-shadow-md">
                  TS.BS. Nguyễn Văn Hùng
                  <span className="block text-[9px] text-emerald-300 font-normal">Trượt gót êm ái trên mặt phẳng</span>
                </div>
              </div>
            </div>

            {/* Placeholder khi chưa bật Camera */}
            {!isCameraActive && !isSimulating && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                  <Camera className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Camera Nhận Diện Khớp Gối Đang Tắt</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Bấm "Bật Camera" hoặc "Mô Phỏng Demo" để AI theo dõi góc co duỗi khớp gối theo thời gian thực.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsCameraActive(true);
                      addLog('Đã kích hoạt Webcam & AI Pose Tracker.', 'success');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Bật Camera Tập Luyện
                  </button>
                  <button 
                    onClick={() => {
                      setIsSimulating(true);
                      addLog('Kích hoạt chế độ mô phỏng Autopilot.', 'success');
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                  >
                    Mô Phỏng Demo
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Video Action Bar */}
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> 18.5 Kcal tiêu hao
              </span>
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Thời gian tập: 04:32
              </span>
            </div>
            <div className="text-[11px] text-slate-500 italic">
              *Giữ bàn chân tiếp xúc mặt giường trong suốt hành trình
            </div>
          </div>

        </section>


        {/* ==================== CỘT PHẢI (32%): COUNTER, WARNINGS, PROGRESS, BUTTONS, TERMINAL LOG ==================== */}
        <section className="lg:col-span-4 flex flex-col gap-3 min-h-0">
          
          {/* Card 1: Bộ đếm Rep Counter Lớn & Tiến độ phần trăm */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Số Lần Thực Hiện</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md text-[10px] font-mono font-bold border border-emerald-500/30">
                Hiệp 1 / 3
              </span>
            </div>

            <div className="flex items-baseline justify-between my-1">
              <div className="text-4xl font-black font-mono text-white tracking-tight flex items-baseline gap-1">
                <span className="text-emerald-400 text-5xl">{repCount}</span>
                <span className="text-slate-500 text-2xl font-normal">/ {targetReps}</span>
                <span className="text-xs text-slate-400 font-sans ml-1 font-semibold">Reps</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-emerald-400">{progressPercent}%</span>
                <span className="block text-[10px] text-slate-400">Hoàn thành</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800 my-2">
              <div 
                className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-md shadow-emerald-500/50" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button 
                onClick={() => {
                  setRepCount(prev => Math.min(targetReps, prev + 1));
                  addLog(`Thủ công: Ghi nhận +1 Rep (${repCount + 1}/${targetReps})`, 'success');
                }}
                className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> +1 Lần (Đạt)
              </button>
              <button 
                onClick={() => {
                  setRepCount(0);
                  addLog('Đã đặt lại bộ đếm số lần tập.', 'info');
                }}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-700/60"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Làm Lại
              </button>
            </div>
          </div>

          {/* Card 2: 2 Thẻ Cảnh Báo An Toàn Màu Vàng Cam (Amber Warning Cards) */}
          <div className="space-y-2 shrink-0">
            {/* Cảnh báo 1 */}
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start gap-2.5 shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-amber-300 block mb-0.5">Cảnh Báo Tốc Độ Trượt Gót:</span>
                <span className="text-slate-300 leading-relaxed text-[11px]">
                  Không co gập giật cục. Trượt gót từ từ trong 3 giây, giữ 2 giây ở đỉnh rồi hạ chân êm ái.
                </span>
              </div>
            </div>

            {/* Cảnh báo 2 */}
            <div className="p-3 bg-amber-950/20 border border-amber-500/25 rounded-xl flex items-start gap-2.5 shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-amber-300 block mb-0.5">Ngưỡng Đau Lâm Sàng (VAS &le; 3):</span>
                <span className="text-slate-300 leading-relaxed text-[11px]">
                  Nếu cảm thấy đau buốt quanh bao khớp vượt mức 4/10, hãy dừng ngay và bấm nút gọi Bác sĩ.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Khung Nhật Ký Hoạt Động (Terminal Log) Dưới Cùng */}
          <div className="flex-1 bg-slate-950 border border-slate-800/90 rounded-2xl p-3 flex flex-col min-h-[140px] shadow-inner overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-bold">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nhật Ký AI Motion Guard</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>

            {/* Terminal Feed Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'warning' ? 'text-amber-400' :
                    log.type === 'error' ? 'text-rose-400' : 'text-slate-300'
                  }>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </section>

      </main>

    </div>
  );
}
