"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { speechCoach, type Language } from "@/lib/speech";

export interface RepResult {
  reps: number;
  targetReps: number;
  formQualityScore: number; // trung bình độ chính xác góc gối (0-100)
}

interface Props {
  targetReps?: number;
  onSessionComplete: (result: RepResult) => void;
  lang?: Language;
  onLangChange?: (lang: Language) => void;
}

// Landmark MediaPipe Pose
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const LEFT_KNEE = 25;
const RIGHT_KNEE = 26;
const LEFT_ANKLE = 27;
const RIGHT_ANKLE = 28;
const LEFT_FOOT = 31;
const RIGHT_FOOT = 32;

// Ngưỡng góc lâm sàng thực tế (phù hợp cho bệnh nhân sau mổ khớp gối)
const EXTENDED_THRESHOLD = 142; // Chân duỗi thẳng (>142 độ)
const FLEXED_THRESHOLD = 118; // Chân gập đủ sâu (<118 độ)

// Trạng thái vận động có cơ chế tự phục hồi
type RepState = "waiting_flex" | "flexing" | "peak_reached" | "extending";

type LandmarkPoint = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

function calcAngle(
  a: LandmarkPoint,
  b: LandmarkPoint,
  c: LandmarkPoint
): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  if (magAB === 0 || magCB === 0) return 180;
  const cosAngle = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

// BỘ LỌC GIẢI PHẪU HỌC & ĐỘ TIN CẬY: Phân biệt chính xác chân thật và tay
function validateLegLandmarks(
  hip?: LandmarkPoint,
  knee?: LandmarkPoint,
  ankle?: LandmarkPoint,
  shoulder?: LandmarkPoint,
  wrist?: LandmarkPoint
): { isValid: boolean; reason?: string; angle: number | null } {
  if (!hip || !knee || !ankle) return { isValid: false, angle: null };

  const hipVis = hip.visibility ?? 0;
  const kneeVis = knee.visibility ?? 0;
  const ankleVis = ankle.visibility ?? 0;

  // 1. Độ tin cậy (Visibility) thực tế:
  // Ngưỡng 0.38 - 0.40 là tối ưu trong thực tế (không quá khắt khe làm mất chân khi ngồi ghế)
  // Khi không có chân (chỉ giơ tay), MediaPipe thường cho visibility < 0.25
  if (kneeVis < 0.38 || ankleVis < 0.35 || hipVis < 0.35) {
    return { isValid: false, reason: "low_visibility", angle: null };
  }

  // 2. Chiều cao hình học: Khớp gối không thể nằm cao hơn vai
  if (shoulder && (shoulder.visibility ?? 0) > 0.45) {
    if (knee.y < shoulder.y) {
      return { isValid: false, reason: "knee_above_shoulder", angle: null };
    }
  }

  // Gối không được nằm cao hơn mông quá nhiều (trừ khi nâng cao đùi, nhưng gối không thể trên mông > 0.20)
  if (knee.y < hip.y - 0.18) {
    return { isValid: false, reason: "knee_above_hip", angle: null };
  }

  // 3. Kích thước xương đùi và cẳng chân phải đủ lớn (loại bỏ ảo giác tụ điểm)
  const thighLength = Math.hypot(knee.x - hip.x, knee.y - hip.y);
  const shinLength = Math.hypot(ankle.x - knee.x, ankle.y - knee.y);
  if (thighLength < 0.045 || shinLength < 0.045) {
    return { isValid: false, reason: "unrealistic_limb_length", angle: null };
  }

  // 4. Nếu cổ tay nằm sát gối mà gối có độ tin cậy quá thấp (< 0.5) trong khi cổ tay rất rõ (> 0.75)
  if (wrist && (wrist.visibility ?? 0) > 0.75 && kneeVis < 0.5) {
    const wristToKnee = Math.hypot(wrist.x - knee.x, wrist.y - knee.y);
    if (wristToKnee < 0.05) {
      return { isValid: false, reason: "hand_interference", angle: null };
    }
  }

  return {
    isValid: true,
    angle: calcAngle(hip, knee, ankle),
  };
}

export default function PoseRehabTracker({
  targetReps = 10,
  onSessionComplete,
  lang = "vi",
  onLangChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Bộ nhớ trạng thái rep counter & Làm mượt tọa độ
  const repStateRef = useRef<RepState>("waiting_flex");
  const repsRef = useRef(0);
  const lastRepTimeRef = useRef(0);
  const angleHistoryRef = useRef<number[]>([]);
  const qualityScoresRef = useRef<number[]>([]);
  const activeLegRef = useRef<"right" | "left">("right");
  const lastHandAlertVoiceRef = useRef(0);

  // Bộ lọc làm mượt tọa độ EMA (Exponential Moving Average) cho các khớp chân
  const smoothedPointsRef = useRef<{ [key: number]: { x: number; y: number } }>({});

  const [currentLang, setCurrentLang] = useState<Language>(lang);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isHandOnlyDetected, setIsHandOnlyDetected] = useState(false);
  const [reps, setReps] = useState(0);
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [activeLeg, setActiveLeg] = useState<"right" | "left">("right");
  const [exerciseStatus, setExerciseStatus] = useState<"correct" | "adjusting" | "peak">("adjusting");
  const [feedback, setFeedback] = useState("Đang tải mô hình nhận diện khung xương…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    speechCoach.setLanguage(currentLang);
    if (onLangChange) onLangChange(currentLang);
  }, [currentLang, onLangChange]);

  const toggleLanguage = (newLang: Language) => {
    setCurrentLang(newLang);
    speechCoach.setLanguage(newLang);
    speechCoach.speak(
      newLang === "vi" ? "Chuyển sang tiếng Việt" : "Switched to English",
      newLang === "vi" ? "Chuyển sang tiếng Việt" : "Switched to English",
      { force: true }
    );
  };

  const toggleVoice = () => {
    const nextMuted = !isVoiceMuted;
    setIsVoiceMuted(nextMuted);
    speechCoach.setMuted(nextMuted);
    if (!nextMuted) {
      speechCoach.speak("Đã bật giọng nói hướng dẫn", "Voice guidance enabled", { force: true });
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        let landmarker: PoseLandmarker | null = null;
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          });
        } catch (gpuErr) {
          console.warn("GPU delegate not available, switching to CPU delegate:", gpuErr);
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          });
        }
        if (cancelled || !landmarker) return;
        landmarkerRef.current = landmarker;
        setIsLoading(false);
        setFeedback(
          currentLang === "vi"
            ? "Sẵn sàng. Bấm “Bắt đầu tập” và đặt camera thấy rõ chân của bạn."
            : "Ready. Click “Start Exercise” and position camera to view your legs."
        );
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(
            currentLang === "vi"
              ? "Không tải được mô hình AI. Vui lòng kiểm tra kết nối mạng."
              : "Failed to load AI model. Please check network connection."
          );
          setIsLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      speechCoach.cancel();
    };
  }, [currentLang]);

  const stopCamera = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsRunning(false);
    speechCoach.cancel();
  }, []);

  const predictLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafIdRef.current = requestAnimationFrame(predictLoop);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const result: PoseLandmarkerResult = landmarker.detectForVideo(
      video,
      performance.now()
    );

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (result.landmarks && result.landmarks.length > 0) {
      const lm = result.landmarks[0];

      // Vai & Thân trên
      const rShoulder = lm[RIGHT_SHOULDER];
      const lShoulder = lm[LEFT_SHOULDER];

      // Cánh tay (Khuỷu tay & Cổ tay)
      const rElbow = lm[RIGHT_ELBOW];
      const lElbow = lm[LEFT_ELBOW];
      const rWrist = lm[RIGHT_WRIST];
      const lWrist = lm[LEFT_WRIST];

      // Chân phải (Hông, Gối, Cổ chân, Bàn chân)
      const rHip = lm[RIGHT_HIP];
      const rKnee = lm[RIGHT_KNEE];
      const rAnkle = lm[RIGHT_ANKLE];
      const rFoot = lm[RIGHT_FOOT];

      // Chân trái
      const lHip = lm[LEFT_HIP];
      const lKnee = lm[LEFT_KNEE];
      const lAnkle = lm[LEFT_ANKLE];
      const lFoot = lm[LEFT_FOOT];

      // 1. KIỂM TRA NHẬN DIỆN CÁNH TAY
      const isRightArmVisible =
        (rShoulder?.visibility ?? 0) > 0.4 &&
        (rElbow?.visibility ?? 0) > 0.4 &&
        (rWrist?.visibility ?? 0) > 0.35;

      const isLeftArmVisible =
        (lShoulder?.visibility ?? 0) > 0.4 &&
        (lElbow?.visibility ?? 0) > 0.4 &&
        (lWrist?.visibility ?? 0) > 0.35;

      const isAnyArmVisible = isRightArmVisible || isLeftArmVisible;

      // 2. VẼ KHUNG XƯƠNG CÁNH TAY (MÀU CYAN/XANH DƯƠNG RIÊNG BIỆT ĐỂ BỆNH NHÂN THẤY RÕ AI ĐÃ PHÂN BIỆT TAY)
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.85)"; // Sky blue / cyan
      ctx.fillStyle = "#38bdf8";
      ctx.lineCap = "round";

      if (isRightArmVisible && rShoulder && rElbow && rWrist) {
        ctx.beginPath();
        ctx.moveTo(rShoulder.x * canvas.width, rShoulder.y * canvas.height);
        ctx.lineTo(rElbow.x * canvas.width, rElbow.y * canvas.height);
        ctx.lineTo(rWrist.x * canvas.width, rWrist.y * canvas.height);
        ctx.stroke();

        [rElbow, rWrist].forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      if (isLeftArmVisible && lShoulder && lElbow && lWrist) {
        ctx.beginPath();
        ctx.moveTo(lShoulder.x * canvas.width, lShoulder.y * canvas.height);
        ctx.lineTo(lElbow.x * canvas.width, lElbow.y * canvas.height);
        ctx.lineTo(lWrist.x * canvas.width, lWrist.y * canvas.height);
        ctx.stroke();

        [lElbow, lWrist].forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
      ctx.restore();

      // 3. KIỂM TRA CHÂN BẰNG BỘ LỌC GIẢI PHẪU HỌC & ĐỘ TIN CẬY
      const rightLegRes = validateLegLandmarks(rHip, rKnee, rAnkle, rShoulder, rWrist);
      const leftLegRes = validateLegLandmarks(lHip, lKnee, lAnkle, lShoulder, lWrist);
      const hasValidLegs = rightLegRes.isValid || leftLegRes.isValid;

      // 4. NẾU KHÔNG CÓ CHÂN HỢP LỆ TRONG KHUNG HÌNH
      if (!hasValidLegs) {
        setCurrentAngle(null);

        if (isAnyArmVisible) {
          // Người dùng chỉ để tay vào khung hình hoặc ngồi khuất chân dưới bàn
          setIsHandOnlyDetected(true);
          setExerciseStatus("adjusting");

          // Vẽ bảng thông báo đỏ cảnh báo trên canvas
          ctx.save();
          const alertW = Math.min(canvas.width - 32, 410);
          const alertH = 54;
          const alertX = (canvas.width - alertW) / 2;
          const alertY = 18;

          ctx.fillStyle = "rgba(220, 38, 38, 0.92)"; // Đỏ cảnh báo nổi bật
          ctx.strokeStyle = "#fca5a5";
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(alertX, alertY, alertW, alertH, 10);
          } else {
            ctx.rect(alertX, alertY, alertW, alertH);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            currentLang === "vi"
              ? "⚠️ PHÁT HIỆN TAY — VUI LÒNG LÙI LẠI ĐỂ THẤY CHÂN"
              : "⚠️ HAND DETECTED — STEP BACK TO SHOW LEGS",
            canvas.width / 2,
            alertY + 22
          );

          ctx.font = "11px sans-serif";
          ctx.fillStyle = "#fef2f2";
          ctx.fillText(
            currentLang === "vi"
              ? "Hệ thống phân biệt rõ tay và chỉ tính rep khi thấy gối & cổ chân"
              : "Arms are detected separately. Reps only count for legs",
            canvas.width / 2,
            alertY + 41
          );

          // Vẽ nhãn nhỏ ngay tại cổ tay
          const primaryWrist =
            (rWrist?.visibility ?? 0) > (lWrist?.visibility ?? 0) ? rWrist : lWrist;
          if (primaryWrist) {
            const wX = primaryWrist.x * canvas.width;
            const wY = primaryWrist.y * canvas.height;
            ctx.fillStyle = "rgba(14, 165, 233, 0.92)";
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(wX - 52, wY - 26, 104, 20, 4);
            } else {
              ctx.rect(wX - 52, wY - 26, 104, 20);
            }
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10.5px sans-serif";
            ctx.fillText(
              currentLang === "vi" ? "💪 Cánh tay (Bỏ qua)" : "💪 Arm (Ignored)",
              wX,
              wY - 12
            );
          }
          ctx.restore();

          setFeedback(
            currentLang === "vi"
              ? "Đang phát hiện cánh tay. Bác hãy lùi camera lại để thấy rõ hai chân và khớp gối nhé!"
              : "Hand detected. Please step back so your knees and legs are clearly visible!"
          );

          // Giọng nói nhắc nhở (cách nhau tối thiểu 6 giây)
          const now = Date.now();
          if (now - lastHandAlertVoiceRef.current > 6000) {
            lastHandAlertVoiceRef.current = now;
            speechCoach.speak(
              "Em chỉ thấy tay của bạn, bạn hãy lùi lại để camera thấy rõ đầu gối và chân nhé.",
              "Only hands detected, please step back so your knees and legs are visible.",
              { force: false }
            );
          }
        } else {
          setIsHandOnlyDetected(false);
          setFeedback(
            currentLang === "vi"
              ? "Không thấy rõ chân trong khung hình. Bác hãy lùi lại để camera thấy toàn thân."
              : "Leg not clearly detected. Please step back to fit inside the camera view."
          );
        }
      } else {
        // ĐÃ NHẬN DIỆN ĐƯỢC CHÂN HỢP LỆ!
        setIsHandOnlyDetected(false);

        // HÀM LÀM MƯỢT TỌA ĐỘ KHỚP (EMA ANTI-JITTER FILTER)
        const smoothPt = (id: number, pt: LandmarkPoint, alpha = 0.45) => {
          const prev = smoothedPointsRef.current[id];
          if (!prev) {
            smoothedPointsRef.current[id] = { x: pt.x, y: pt.y };
            return { x: pt.x, y: pt.y };
          }
          const next = {
            x: prev.x * (1 - alpha) + pt.x * alpha,
            y: prev.y * (1 - alpha) + pt.y * alpha,
          };
          smoothedPointsRef.current[id] = next;
          return next;
        };

        const smRightHip = smoothPt(RIGHT_HIP, rHip);
        const smRightKnee = smoothPt(RIGHT_KNEE, rKnee);
        const smRightAnkle = smoothPt(RIGHT_ANKLE, rAnkle);
        const smRightFoot = rFoot ? smoothPt(RIGHT_FOOT, rFoot) : null;

        const smLeftHip = smoothPt(LEFT_HIP, lHip);
        const smLeftKnee = smoothPt(LEFT_KNEE, lKnee);
        const smLeftAnkle = smoothPt(LEFT_ANKLE, lAnkle);
        const smLeftFoot = lFoot ? smoothPt(LEFT_FOOT, lFoot) : null;

        // Tự động phát hiện chân đang tập (có độ trễ hysteresis để tránh nhảy chân liên tục)
        let chosenLeg: "right" | "left" = activeLegRef.current;
        if (rightLegRes.isValid && leftLegRes.isValid) {
          const rightAngle = rightLegRes.angle!;
          const leftAngle = leftLegRes.angle!;
          if (rightAngle < 135 && rightAngle < leftAngle - 10) {
            chosenLeg = "right";
          } else if (leftAngle < 135 && leftAngle < rightAngle - 10) {
            chosenLeg = "left";
          }
        } else if (rightLegRes.isValid) {
          chosenLeg = "right";
        } else if (leftLegRes.isValid) {
          chosenLeg = "left";
        }
        activeLegRef.current = chosenLeg;
        setActiveLeg(chosenLeg);

        const isRightActive = chosenLeg === "right";

        // Tọa độ chân tập (Active) và chân thứ hai (Secondary)
        const actHip = isRightActive ? smRightHip : smLeftHip;
        const actKnee = isRightActive ? smRightKnee : smLeftKnee;
        const actAnkle = isRightActive ? smRightAnkle : smLeftAnkle;
        const actFoot = isRightActive ? smRightFoot : smLeftFoot;

        const secHip = isRightActive ? smLeftHip : smRightHip;
        const secKnee = isRightActive ? smLeftKnee : smRightKnee;
        const secAnkle = isRightActive ? smLeftAnkle : smRightAnkle;
        const secFoot = isRightActive ? smLeftFoot : smRightFoot;
        const secLabel = isRightActive
          ? currentLang === "vi" ? "Chân trái (Trụ)" : "Left Leg"
          : currentLang === "vi" ? "Chân phải (Trụ)" : "Right Leg";

        // Góc gập chân đang tập
        const rawAngle = calcAngle(actHip, actKnee, actAnkle);

        if (actHip && actKnee && actAnkle && rawAngle !== null) {
          // Làm mượt góc qua bộ đệm 4 khung hình (Moving Average)
          const hist = angleHistoryRef.current;
          hist.push(rawAngle);
          if (hist.length > 4) hist.shift();
          const smoothedAngle = Math.round(
            hist.reduce((a, b) => a + b, 0) / hist.length
          );
          setCurrentAngle(smoothedAngle);

          // 1. Trạng thái góc
          const isPeakFlexed = smoothedAngle <= FLEXED_THRESHOLD;
          const isFullyExtended = smoothedAngle >= EXTENDED_THRESHOLD;
          const isCorrect = isPeakFlexed || isFullyExtended;

          const activeColor = isPeakFlexed
            ? "#10b981" // Xanh lá Neon khi gập sâu đạt đỉnh
            : isFullyExtended
            ? "#059669" // Xanh đậm khi duỗi thẳng
            : "#f59e0b"; // Vàng cam khi đang gập dở dang

          const glowColor = isPeakFlexed ? "#00ff88" : "#fbbf24";
          setExerciseStatus(isPeakFlexed ? "peak" : isFullyExtended ? "correct" : "adjusting");

          // 2. VẼ THÂN TRÊN VÀ KHUNG CHẬU NỐI 2 HÔNG (PELVIS)
          ctx.save();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.setLineDash([4, 4]);

          if (lShoulder && rShoulder && smLeftHip && smRightHip) {
            ctx.beginPath();
            ctx.moveTo(lShoulder.x * canvas.width, lShoulder.y * canvas.height);
            ctx.lineTo(rShoulder.x * canvas.width, rShoulder.y * canvas.height);
            ctx.lineTo(smRightHip.x * canvas.width, smRightHip.y * canvas.height);
            ctx.lineTo(smLeftHip.x * canvas.width, smLeftHip.y * canvas.height);
            ctx.closePath();
            ctx.stroke();

            // Khung chậu nối 2 hông (Đường liền rõ ràng)
            ctx.setLineDash([]);
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
            ctx.beginPath();
            ctx.moveTo(smLeftHip.x * canvas.width, smLeftHip.y * canvas.height);
            ctx.lineTo(smRightHip.x * canvas.width, smRightHip.y * canvas.height);
            ctx.stroke();
          }
          ctx.restore();

          // 3. VẼ CHÂN THỨ HAI (CHÂN TRỤ / SECONDARY LEG - MÀU XANH CYAN RÕ NÉT)
          // LUÔN VẼ CẢ 2 CHÂN ĐỂ BỆNH NHÂN THẤY ĐỦ TOÀN BỘ KHUNG XƯƠNG
          if (secHip && secKnee && secAnkle) {
            ctx.save();
            ctx.lineWidth = 3.8;
            ctx.strokeStyle = "rgba(56, 189, 248, 0.85)"; // Sky blue / Cyan
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.beginPath();
            ctx.moveTo(secHip.x * canvas.width, secHip.y * canvas.height);
            ctx.lineTo(secKnee.x * canvas.width, secKnee.y * canvas.height);
            ctx.lineTo(secAnkle.x * canvas.width, secAnkle.y * canvas.height);
            if (secFoot) {
              ctx.lineTo(secFoot.x * canvas.width, secFoot.y * canvas.height);
            }
            ctx.stroke();

            // Khớp chân thứ hai
            [secHip, secKnee, secAnkle].forEach((p, idx) => {
              const pX = p.x * canvas.width;
              const pY = p.y * canvas.height;
              ctx.beginPath();
              ctx.arc(pX, pY, idx === 1 ? 8 : 6, 0, 2 * Math.PI);
              ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
              ctx.fill();

              ctx.beginPath();
              ctx.arc(pX, pY, idx === 1 ? 4 : 2.5, 0, 2 * Math.PI);
              ctx.fillStyle = "#ffffff";
              ctx.fill();
            });

            // Nhãn nhỏ tại gối chân thứ hai
            ctx.font = "bold 10.5px sans-serif";
            ctx.fillStyle = "rgba(14, 165, 233, 0.9)";
            const secKx = secKnee.x * canvas.width;
            const secKy = secKnee.y * canvas.height;
            const secTextW = ctx.measureText(secLabel).width;
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(secKx - secTextW / 2 - 5, secKy + 12, secTextW + 10, 18, 4);
              ctx.fill();
            }
            ctx.fillStyle = "#ffffff";
            ctx.fillText(secLabel, secKx - secTextW / 2, secKy + 25);
            ctx.restore();
          }

          // 4. VẼ CHÂN ĐANG TẬP (ACTIVE REHAB LEG - ĐƯỜNG PHÁT SÁNG NỔI BẬT)
          ctx.save();
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = isCorrect ? 16 : 8;
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = isCorrect ? 6.5 : 5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          ctx.beginPath();
          ctx.moveTo(actHip.x * canvas.width, actHip.y * canvas.height);
          ctx.lineTo(actKnee.x * canvas.width, actKnee.y * canvas.height);
          ctx.lineTo(actAnkle.x * canvas.width, actAnkle.y * canvas.height);
          if (actFoot) {
            ctx.lineTo(actFoot.x * canvas.width, actFoot.y * canvas.height);
          }
          ctx.stroke();
          ctx.restore();

          // 5. VẼ THƯỚC ĐO GÓC CONG TẠI KHỚP GỐI CHÂN TẬP
          const kX = actKnee.x * canvas.width;
          const kY = actKnee.y * canvas.height;
          const angleRadius = 34;

          const startAngle = Math.atan2(
            actHip.y * canvas.height - kY,
            actHip.x * canvas.width - kX
          );
          const endAngle = Math.atan2(
            actAnkle.y * canvas.height - kY,
            actAnkle.x * canvas.width - kX
          );

          ctx.save();
          ctx.beginPath();
          ctx.arc(kX, kY, angleRadius, startAngle, endAngle);
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // 6. CÁC ĐIỂM KHỚP PHÁT SÁNG CỦA CHÂN TẬP
          [actHip, actKnee, actAnkle].forEach((p, idx) => {
            const pX = p.x * canvas.width;
            const pY = p.y * canvas.height;

            ctx.beginPath();
            ctx.arc(pX, pY, idx === 1 ? 12 : 8, 0, 2 * Math.PI);
            ctx.fillStyle = activeColor;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pX, pY, idx === 1 ? 5 : 3.5, 0, 2 * Math.PI);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
          });

          // 7. NHÃN BONG BÓNG TRẠNG THÁI TẠI GỐI CHÂN TẬP
          const tagText = isPeakFlexed
            ? currentLang === "vi"
              ? `✓ GẬP TỐT (${smoothedAngle}°)`
              : `✓ GOOD FLEX (${smoothedAngle}°)`
            : isFullyExtended
            ? currentLang === "vi"
              ? `✓ DUỖI THẲNG (${smoothedAngle}°)`
              : `✓ STRAIGHT (${smoothedAngle}°)`
            : currentLang === "vi"
            ? `GẬP THÊM (${smoothedAngle}°)`
            : `FLEX DEEPER (${smoothedAngle}°)`;

          ctx.font = "bold 13px sans-serif";
          const textWidth = ctx.measureText(tagText).width;
          const tagX = Math.min(canvas.width - textWidth - 16, Math.max(10, kX + 16));
          const tagY = Math.max(26, kY - 14);

          ctx.beginPath();
          ctx.fillStyle = isCorrect ? "rgba(6, 78, 59, 0.88)" : "rgba(120, 53, 15, 0.88)";
          if (ctx.roundRect) {
            ctx.roundRect(tagX - 6, tagY - 16, textWidth + 12, 22, 6);
          } else {
            ctx.rect(tagX - 6, tagY - 16, textWidth + 12, 22);
          }
          ctx.fill();
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.fillText(tagText, tagX, tagY);
          ctx.restore();

          // 7. BỘ MÁY ĐẾM REP CHUẨN XÁC CHỈ KÍCH HOẠT CHO CHÂN THẬT (REHAB ROBUST STATE MACHINE)
          const now = Date.now();
          const currentState = repStateRef.current;

          // BƯỚC 1: Bắt đầu gập từ trạng thái duỗi
          if (currentState === "waiting_flex" && smoothedAngle < EXTENDED_THRESHOLD - 5) {
            repStateRef.current = "flexing";
            setFeedback(
              currentLang === "vi"
                ? "Đang gập gối — tiếp tục kéo chân vào sát mông."
                : "Flexing knee — pull your leg in towards your hip."
            );
          }
          // BƯỚC 2: Đạt đỉnh góc gập (< 118 độ)
          else if (
            (currentState === "flexing" || currentState === "waiting_flex") &&
            smoothedAngle <= FLEXED_THRESHOLD
          ) {
            repStateRef.current = "peak_reached";

            // Tính điểm chất lượng góc gập
            const quality = Math.max(0, Math.min(100, Math.round(100 - (smoothedAngle - 75) * 1.5)));
            qualityScoresRef.current.push(quality);

            setFeedback(
              currentLang === "vi"
                ? "Đã đạt góc gập chuẩn! Từ từ duỗi thẳng chân ra."
                : "Target flex reached! Now slowly extend your leg straight."
            );

            speechCoach.speak(
              "Rất tốt! Giờ từ từ duỗi thẳng chân ra.",
              "Great! Now slowly extend your leg straight.",
              { interval: 2200 }
            );
          }
          // BƯỚC 3: Đang duỗi trở lại sau khi đã gập thành công
          else if (currentState === "peak_reached" && smoothedAngle > FLEXED_THRESHOLD + 10) {
            repStateRef.current = "extending";
          }
          // BƯỚC 4: Hoàn thành duỗi thẳng (> 142 độ) -> CHÍNH THỨC CỘNG 1 REP!
          else if (
            (currentState === "extending" || currentState === "peak_reached") &&
            smoothedAngle >= EXTENDED_THRESHOLD
          ) {
            // Chống cộng đúp (Debounce cooldown tối thiểu 1.1 giây giữa các rep)
            if (now - lastRepTimeRef.current > 1100) {
              lastRepTimeRef.current = now;
              repsRef.current += 1;
              const newCount = repsRef.current;
              setReps(newCount);

              repStateRef.current = "waiting_flex";

              setFeedback(
                currentLang === "vi"
                  ? `Xuất sắc! Đã hoàn thành ${newCount}/${targetReps} lần.`
                  : `Awesome! Rep ${newCount}/${targetReps} completed.`
              );

              speechCoach.speak(
                `Được ${newCount} lần rồi!`,
                `Rep ${newCount} completed!`,
                { force: true }
              );

              // Kiểm tra hoàn thành toàn bộ bài tập
              if (newCount >= targetReps) {
                const scores = qualityScoresRef.current;
                const avgScore =
                  scores.length > 0
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : 85;

                speechCoach.speak(
                  "Chúc mừng bác đã hoàn thành bài tập phục hồi hôm nay!",
                  "Congratulations! You have completed today's rehabilitation exercise!",
                  { force: true }
                );

                stopCamera();
                onSessionComplete({
                  reps: newCount,
                  targetReps,
                  formQualityScore: avgScore,
                });
                ctx.restore();
                return;
              }
            } else {
              repStateRef.current = "waiting_flex";
            }
          }
          // TỰ ĐỘNG PHỤC HỒI (FAIL-SAFE): Nếu người dùng gập chưa tới mà duỗi ra lại, reset về waiting_flex
          else if (currentState === "flexing" && smoothedAngle >= EXTENDED_THRESHOLD) {
            repStateRef.current = "waiting_flex";
            setFeedback(
              currentLang === "vi"
                ? "Chưa gập đủ sâu. Bác hãy gập sâu hơn một chút nhé."
                : "Not bent deep enough. Please flex your knee a bit deeper."
            );
          }
        }
      }
    } else {
      setIsHandOnlyDetected(false);
      setCurrentAngle(null);
      setFeedback(
        currentLang === "vi"
          ? "Không thấy người hoặc chân trong khung hình. Bác hãy lùi lại trước camera."
          : "No person or legs detected. Please position yourself in front of the camera."
      );
    }

    ctx.restore();
    rafIdRef.current = requestAnimationFrame(predictLoop);
  }, [currentLang, onSessionComplete, stopCamera, targetReps]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      repsRef.current = 0;
      lastRepTimeRef.current = 0;
      lastHandAlertVoiceRef.current = 0;
      repStateRef.current = "waiting_flex";
      angleHistoryRef.current = [];
      qualityScoresRef.current = [];
      setReps(0);
      setIsHandOnlyDetected(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsRunning(true);

      speechCoach.speak(
        "Bắt đầu bài tập. Bác hãy lùi lại và gập gối chân của mình nhé.",
        "Starting exercise. Please step back and flex your knee.",
        { force: true }
      );

      rafIdRef.current = requestAnimationFrame(predictLoop);
    } catch (e) {
      console.error(e);
      setError(
        currentLang === "vi"
          ? "Không truy cập được camera. Vui lòng cấp quyền camera cho trình duyệt."
          : "Cannot access camera. Please allow camera permissions."
      );
    }
  }, [currentLang, predictLoop]);

  useEffect(() => stopCamera, [stopCamera]);

  return (
    <div className="flex flex-col gap-4">
      {/* Control bar: Language & Voice coach */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500 uppercase tracking-wider">
            {currentLang === "vi" ? "Trợ lý giọng nói AI:" : "AI Voice Coach:"}
          </span>
          <button
            onClick={toggleVoice}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
              !isVoiceMuted
                ? "bg-care-100 text-care-800 border border-care-400"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            }`}
          >
            <span>{!isVoiceMuted ? "🔊 Đang bật (On)" : "🔇 Tắt (Muted)"}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => toggleLanguage("vi")}
            className={`px-2 py-0.5 rounded font-semibold transition ${
              currentLang === "vi"
                ? "bg-care-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🇻🇳 VN
          </button>
          <button
            onClick={() => toggleLanguage("en")}
            className={`px-2 py-0.5 rounded font-semibold transition ${
              currentLang === "en"
                ? "bg-care-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🇺🇸 EN
          </button>
        </div>
      </div>

      {/* Video & Canvas Container */}
      <div className="relative w-full max-w-md mx-auto aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-slate-800">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="w-full h-full object-cover" />

        {!isRunning && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-white text-center p-4">
            {isLoading
              ? currentLang === "vi"
                ? "Đang tải mô hình AI…"
                : "Loading AI model…"
              : currentLang === "vi"
              ? "Bấm “Bắt đầu tập” để mở camera"
              : "Click “Start Exercise” to turn on camera"}
          </div>
        )}

        {/* CẢNH BÁO KHI PHÁT HIỆN TAY THAY VÌ CHÂN */}
        {isHandOnlyDetected && isRunning && (
          <div className="absolute top-3 left-3 right-3 bg-red-600/95 backdrop-blur-xs text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl border border-red-400/80 flex items-start gap-2.5 animate-pulse z-20">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="font-bold text-sm leading-tight">
                {currentLang === "vi"
                  ? "Phát hiện cánh tay (Không tính vào bài tập chân)"
                  : "Hand detected (Ignored for leg exercise)"}
              </p>
              <p className="text-[11.5px] text-red-100 mt-0.5 leading-snug">
                {currentLang === "vi"
                  ? "Vui lòng lùi lại để camera thấy rõ khớp gối và hai chân của bạn."
                  : "Please step back so your knees and legs are clearly visible."}
              </p>
            </div>
          </div>
        )}

        {/* HUD: Góc gối và trạng thái đúng/sai */}
        {currentAngle !== null && isRunning && !isHandOnlyDetected && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm ${
                exerciseStatus === "peak"
                  ? "bg-emerald-900/90 text-emerald-300 border border-emerald-400"
                  : exerciseStatus === "correct"
                  ? "bg-teal-900/85 text-teal-300 border border-teal-500/50"
                  : "bg-amber-900/85 text-amber-300 border border-amber-500/50"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  exerciseStatus === "peak"
                    ? "bg-emerald-400 animate-ping"
                    : exerciseStatus === "correct"
                    ? "bg-teal-400"
                    : "bg-amber-400"
                }`}
              />
              <span>
                {currentLang === "vi" ? "Góc gối" : "Knee Angle"}: {currentAngle}°
              </span>
            </div>

            <div className="bg-black/60 backdrop-blur-xs text-[10px] text-slate-300 px-2 py-0.5 rounded font-medium flex items-center gap-1">
              <span>{activeLeg === "right" ? "Chân phải (Right)" : "Chân trái (Left)"}:</span>
              <span className="font-semibold text-white">
                {exerciseStatus === "peak"
                  ? currentLang === "vi"
                    ? "✓ Đạt độ gập chuẩn!"
                    : "✓ Peak flex reached!"
                  : exerciseStatus === "correct"
                  ? currentLang === "vi"
                    ? "✓ Chân duỗi thẳng"
                    : "✓ Extended straight"
                  : currentLang === "vi"
                  ? "Đang gập chân…"
                  : "Flexing…"}
              </span>
            </div>
          </div>
        )}

        {/* HUD Hướng dẫn màu khung xương ở góc phải */}
        {isRunning && (
          <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] text-white flex items-center gap-2.5 border border-white/10 shadow-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>{currentLang === "vi" ? "Tay (Xanh dương)" : "Arm (Blue)"}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{currentLang === "vi" ? "Chân (Đạt chuẩn)" : "Leg (Valid)"}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{currentLang === "vi" ? "Đang gập" : "Flexing"}</span>
            </span>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-3xl font-bold text-care-700">
          {reps}
          <span className="text-lg text-slate-400 font-medium">
            {" "}
            / {targetReps} {currentLang === "vi" ? "lần" : "reps"}
          </span>
        </p>
        <p className="text-sm text-slate-600 mt-1">{feedback}</p>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>

      <div className="flex justify-center gap-3">
        {!isRunning ? (
          <button
            onClick={startCamera}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-care-600 text-white font-medium disabled:opacity-50 hover:bg-care-700 transition shadow-sm"
          >
            {currentLang === "vi" ? "Bắt đầu tập" : "Start Exercise"}
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-medium hover:bg-slate-300 transition"
          >
            {currentLang === "vi" ? "Dừng lại" : "Stop"}
          </button>
        )}
      </div>
    </div>
  );
}
