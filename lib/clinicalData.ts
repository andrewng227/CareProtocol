export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  surgery: {
    typeVi: string;
    typeEn: string;
    date: string;
    daysPostOp: number;
    surgeon: string;
    hospital: string;
  };
  protocol: {
    id: string;
    nameVi: string;
    nameEn: string;
    currentStageVi: string;
    currentStageEn: string;
    targetRepsPerDay: number;
    targetRomDegrees: number; // Mục tiêu góc gập (ROM)
  };
  compliance: {
    status: "compliant" | "warning" | "critical"; // warning: miss 1 day, critical: miss 2+ days
    streakDays: number;
    completedDaysThisWeek: number;
    totalPrescribedDays: number;
    formQualityAverage: number; // 0-100%
  };
  latestSession?: {
    date: string;
    reps: number;
    targetReps: number;
    achievedRom: number; // Góc sâu nhất đạt được
    qualityScore: number;
    txSignature?: string;
  };
  history: {
    day: string;
    rom: number; // Góc gập
    reps: number;
    quality: number;
    verifiedOnChain: boolean;
  }[];
  notes: string;
}

export const CLINICAL_GUIDELINES_SOURCES = [
  {
    name: "AAOS Clinical Practice Guideline (Total Knee Arthroplasty)",
    organization: "American Academy of Orthopaedic Surgeons",
    url: "https://www.aaos.org/quality/quality-programs/lower-extremity-programs/total-knee-arthroplasty-clinical-practice-guideline/",
    evidenceLevel: "Level I & II Evidence",
    descriptionVi: "Phác đồ chuẩn vàng về tập vận động sớm (Early Mobilization) trong 24-72h sau phẫu thuật thay khớp gối để giảm thiểu biến chứng DVT.",
    descriptionEn: "Gold-standard guidelines for early mobilization within 24-72 hours post-TKA to reduce DVT and stiffness risks.",
  },
  {
    name: "NIH PubMed Central / NCBI E-utilities API",
    organization: "National Institutes of Health (NIH / NLM)",
    url: "https://www.ncbi.nlm.nih.gov/pmc/tools/developers/",
    evidenceLevel: "Peer-reviewed Literature Database",
    descriptionVi: "API truy xuất tài liệu nghiên cứu y khoa lâm sàng, chỉ số ROM khớp gối phục hồi theo từng tuần điều trị.",
    descriptionEn: "API for biomedical literature and clinical trial evidence on post-operative Range of Motion milestones.",
  },
  {
    name: "MedlinePlus Connect API",
    organization: "U.S. National Library of Medicine",
    url: "https://medlineplus.gov/connect/overview.html",
    evidenceLevel: "Consumer Health Authority",
    descriptionVi: "API hướng dẫn bệnh nhân phục hồi tại nhà chuẩn y khoa, phân loại theo mã ICD-10 và SNOMED CT.",
    descriptionEn: "Patient-facing recovery education material mapped to ICD-10-CM and SNOMED-CT clinical codes.",
  },
  {
    name: "HL7 FHIR R4 (Fast Healthcare Interoperability Resources)",
    organization: "HL7 International",
    url: "https://hl7.org/fhir/R4/careplan.html",
    evidenceLevel: "Global Health IT Standard",
    descriptionVi: "Chuẩn tích hợp bệnh án điện tử (CarePlan, Observation, Procedure) kết nối trực tiếp với hệ thống bệnh viện.",
    descriptionEn: "Interoperable health data specification for CarePlan, Physical Therapy Observations, and Hospital EHR syncing.",
  },
];

export const MOCK_PATIENTS: PatientRecord[] = [
  {
    id: "BN-2026-081",
    name: "Nguyễn Văn Hùng (Nguyen Van Hung)",
    age: 58,
    gender: "male",
    surgery: {
      typeVi: "Thay toàn bộ khớp gối phải (TKA)",
      typeEn: "Right Total Knee Arthroplasty (TKA)",
      date: "2026-09-16",
      daysPostOp: 3,
      surgeon: "TS.BS Lê Quang Minh",
      hospital: "Bệnh viện Chấn thương Chỉnh hình",
    },
    protocol: {
      id: "knee-flexion-day-3",
      nameVi: "Gập & duỗi gối tại giường giai đoạn cấp (Ngày 1-5)",
      nameEn: "Bedside Knee Flexion-Extension Acute Stage (Day 1-5)",
      currentStageVi: "Phòng ngừa huyết khối tĩnh mạch sâu (DVT) & chống cứng khớp",
      currentStageEn: "Deep Vein Thrombosis (DVT) Prophylaxis & Anti-Arthrofibrosis",
      targetRepsPerDay: 10,
      targetRomDegrees: 90,
    },
    compliance: {
      status: "compliant",
      streakDays: 3,
      completedDaysThisWeek: 3,
      totalPrescribedDays: 14,
      formQualityAverage: 88,
    },
    latestSession: {
      date: "Hôm nay (Today)",
      reps: 10,
      targetReps: 10,
      achievedRom: 92,
      qualityScore: 90,
      txSignature: "5KtPn...X9a8B (Devnet)",
    },
    history: [
      { day: "Ngày 1", rom: 65, reps: 10, quality: 78, verifiedOnChain: true },
      { day: "Ngày 2", rom: 78, reps: 10, quality: 85, verifiedOnChain: true },
      { day: "Ngày 3", rom: 92, reps: 10, quality: 90, verifiedOnChain: true },
    ],
    notes: "Bệnh nhân đáp ứng tốt, cơ tứ đầu đùi co hồi khá, góc gập tăng đều từ 65° lên 92°.",
  },
  {
    id: "BN-2026-094",
    name: "Trần Thị Mai (Tran Thi Mai)",
    age: 64,
    gender: "female",
    surgery: {
      typeVi: "Nội soi tái tạo dây chằng chéo trước (ACL)",
      typeEn: "Arthroscopic ACL Reconstruction",
      date: "2026-09-14",
      daysPostOp: 5,
      surgeon: "Bác sĩ CareProtocol",
      hospital: "Bệnh viện Đại học Y Dược",
    },
    protocol: {
      id: "acl-rehab-phase-1",
      nameVi: "Phục hồi chức năng ACL giai đoạn 1 (Tuần 1-2)",
      nameEn: "ACL Rehab Protocol Phase 1 (Weeks 1-2)",
      currentStageVi: "Kiểm soát phù nề & lấy lại biên độ duỗi thẳng 0-90°",
      currentStageEn: "Edema Management & Passive/Active Extension to 90°",
      targetRepsPerDay: 15,
      targetRomDegrees: 90,
    },
    compliance: {
      status: "warning",
      streakDays: 0,
      completedDaysThisWeek: 3,
      totalPrescribedDays: 14,
      formQualityAverage: 65,
    },
    latestSession: {
      date: "24 giờ trước (24h ago)",
      reps: 7,
      targetReps: 15,
      achievedRom: 75,
      qualityScore: 68,
      txSignature: "2WvXq...7mB1L (Devnet)",
    },
    history: [
      { day: "Ngày 1", rom: 60, reps: 15, quality: 70, verifiedOnChain: true },
      { day: "Ngày 2", rom: 70, reps: 15, quality: 72, verifiedOnChain: true },
      { day: "Ngày 3", rom: 75, reps: 7, quality: 68, verifiedOnChain: true },
      { day: "Ngày 4", rom: 0, reps: 0, quality: 0, verifiedOnChain: false },
    ],
    notes: "Bệnh nhân bỏ lỡ 1 buổi tập hôm qua, báo đau nhẹ ở mặt trước gối. Cần điều dưỡng gọi điện thăm hỏi.",
  },
  {
    id: "BN-2026-102",
    name: "Lê Hoàng Quân (Le Hoang Quan)",
    age: 42,
    gender: "male",
    surgery: {
      typeVi: "Phẫu thuật kết hợp xương bánh chè",
      typeEn: "Open Reduction and Internal Fixation (ORIF) Patella",
      date: "2026-09-12",
      daysPostOp: 7,
      surgeon: "TS.BS Hoàng Văn Hùng",
      hospital: "Bệnh viện Trung Ương",
    },
    protocol: {
      id: "patella-orif-phase-1",
      nameVi: "Vận động thụ động và chủ động có trợ giúp",
      nameEn: "Passive & Active-Assisted Range of Motion",
      currentStageVi: "Tăng dần góc gập đến 60° không chịu lực",
      currentStageEn: "Gradual non-weight-bearing flexion up to 60°",
      targetRepsPerDay: 12,
      targetRomDegrees: 60,
    },
    compliance: {
      status: "critical",
      streakDays: 0,
      completedDaysThisWeek: 2,
      totalPrescribedDays: 21,
      formQualityAverage: 52,
    },
    latestSession: {
      date: "3 ngày trước (3 days ago)",
      reps: 4,
      targetReps: 12,
      achievedRom: 45,
      qualityScore: 55,
      txSignature: "9LmFk...Z3x8Q (Devnet)",
    },
    history: [
      { day: "Ngày 1", rom: 40, reps: 12, quality: 60, verifiedOnChain: true },
      { day: "Ngày 2", rom: 45, reps: 12, quality: 62, verifiedOnChain: true },
      { day: "Ngày 3", rom: 45, reps: 4, quality: 55, verifiedOnChain: true },
      { day: "Ngày 4", rom: 0, reps: 0, quality: 0, verifiedOnChain: false },
      { day: "Ngày 5", rom: 0, reps: 0, quality: 0, verifiedOnChain: false },
    ],
    notes: "CẢNH BÁO ĐỎ: Bệnh nhân không tập 2 ngày liên tiếp. Nguy cơ dính khớp sau mổ. Bác sĩ yêu cầu tái khám khẩn.",
  },
];
