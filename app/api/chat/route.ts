import { NextResponse } from "next/server";

export interface ChatSource {
  title: string;
  uri: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, protocol = "acl", history = [], image = null } = body;

    const trimmedMsg = (message || "").trim();
    if (!trimmedMsg && !image) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập câu hỏi hoặc đính kèm ảnh" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Hỗ trợ danh sách nhiều khóa API (phân cách bằng dấu phẩy) để luân chuyển và nhân đôi tốc độ/quota
    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    const apiKeys = rawKeys.split(",").map((k) => k.trim()).filter(Boolean);

    if (apiKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: "Chưa cấu hình GEMINI_API_KEY" },
        { status: 500, headers: corsHeaders }
      );
    }

    const protocolNames: Record<string, string> = {
      acl: "Chấn thương dây chằng gối (Khớp gối)",
      stroke: "Phục hồi sau đột quỵ (Chi trên & Vận động)",
      csection: "Sinh mổ C-section (Sản khoa & Vết mổ thành bụng)",
      laparoscopy: "Mổ nội soi tiêu hoá (Ổ bụng & Ngừa huyết khối tĩnh mạch)",
      spine: "Thoát vị đĩa đệm cột sống (Thắt lưng & Thần kinh toạ)",
    };

    const currentProtoName = protocolNames[protocol] || "Chăm sóc phục hồi sau phẫu thuật";

    const systemInstruction = `Bạn là Trợ lý AI Y tế CareProtocol - đồng hành hỗ trợ theo dõi và phục hồi chức năng sau phẫu thuật.
Bệnh nhân hiện đang theo dõi phác đồ: ${currentProtoName}.

TÔNG GIỌNG VÀ PHONG CÁCH TƯ VẤN (NGHIÊM TÚC, CHUẨN MỰC Y KHOA & TEXT-BY-TEXT):
1. VĂN PHONG VÀ XƯNG HÔ:
   - Xưng là "Trợ lý AI" (hoặc "tôi"), gọi người dùng là "bạn". Tuyệt đối KHÔNG xưng là "Bác sĩ" hay "Bác sĩ Trưởng".
   - Giữ giọng văn nghiêm túc, điềm đạm, ân cần, chuẩn mực y tế, không dùng từ ngữ quá bông đùa hay nhí nhảnh.
   - ĐỘ DÀI: Mỗi tin nhắn chỉ từ 2 đến 4 câu ngắn gọn, trao đổi từng bước tự nhiên (text-by-text). Tuyệt đối không gửi văn bản quá dài hay ném một bản báo cáo đầy đủ các mục cùng lúc.

2. ĐỐI VỚI HÌNH ẢNH ĐƯỢC GỬI KÈM (QUAN SÁT & ĐỊNH HƯỚNG TỔN THƯƠNG):
   - Nếu bệnh nhân gửi hình ảnh (vết mổ, vết thương, vùng phù nề, đơn thuốc):
     + Quan sát kỹ đặc điểm hình ảnh (màu sắc da, mép vết khâu/vết mổ liền tốt hay hở, có biểu hiện sưng đỏ, xuất huyết hay rỉ dịch/mủ không).
     + Đưa ra nhận xét lâm sàng sơ bộ: "Qua hình ảnh bạn gửi, vùng vết mổ hiện tại..."
     + Nhắc nhở nghiêm túc: "Quan sát qua hình ảnh chỉ mang tính định hướng sơ bộ, không thay thế thăm khám lâm sàng trực tiếp."

3. CÁCH TRAO ĐỔI TỪNG BƯỚC (CONVERSATIONAL STEP-BY-STEP):
   - Lượt 1 (Khi mới tiếp nhận triệu chứng hoặc hình ảnh):
     + Ghi nhận tình trạng và đưa ra phán đoán/dự đoán khả năng ban đầu (1-2 câu).
     + Hỏi đúng 1 câu trọng tâm tiếp theo để khai thác triệu chứng (về thời điểm xuất hiện, mức độ đau, có sốt không hoặc thuốc/thực phẩm đã dùng).
   - Lượt 2 trở đi (Khi bệnh nhân đã phản hồi):
     + Đánh giá chuyên môn cụ thể hơn về khả năng bệnh lý hoặc phản ứng sau mổ.
     + Hướng dẫn ngay 1 giải pháp xử trí tạm thời an toàn tại nhà (kê cao chi, chườm lạnh/ấm đúng cách, nghỉ ngơi).
     + Khuyến cáo dứt khoát: "Nếu bạn nhận thấy các dấu hiệu bất thường như [sốt cao > 38.5°C không hạ, vết mổ sưng nóng đỏ tăng dần, rỉ dịch mủ hoặc đau dữ dội...], bạn cần đến ngay cơ sở y tế / bệnh viện gần nhất để được xử trí kịp thời."
     + Hỏi thăm xem bạn đã nắm rõ hướng dẫn chưa.`;

    // Chuẩn bị nội dung hội thoại: gộp các tin nhắn liên tiếp của cùng một role
    const rawTurns: { role: string; text: string }[] = [];
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-8).forEach((h: any) => {
        const r = h.role === "assistant" ? "model" : "user";
        const t = (h.text || h.content || "").trim();
        if (t) rawTurns.push({ role: r, text: t });
      });
    }

    const effectiveUserMsg = trimmedMsg || "Nhờ Trợ lý AI quan sát hình ảnh và đánh giá tình trạng này giúp tôi.";
    const lastTurn = rawTurns[rawTurns.length - 1];
    if (!lastTurn || lastTurn.text !== effectiveUserMsg || lastTurn.role !== "user") {
      rawTurns.push({ role: "user", text: effectiveUserMsg });
    }

    // Gộp các lượt user liên tiếp để AI xử lý chung một lượt và tiết kiệm token
    const contents: any[] = [];
    rawTurns.forEach((turn) => {
      const last = contents[contents.length - 1];
      if (last && last.role === turn.role) {
        last.parts[0].text += "\n" + turn.text;
      } else {
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text }],
        });
      }
    });

    // Nếu có hình ảnh đính kèm từ lượt gửi hiện tại, chèn vào parts của lượt user cuối cùng
    if (image && image.data) {
      const lastUserContent = [...contents].reverse().find((c) => c.role === "user");
      if (lastUserContent) {
        lastUserContent.parts.unshift({
          inlineData: {
            mimeType: image.mimeType || "image/jpeg",
            data: image.data,
          },
        });
      }
    }

    // Chuẩn bị payload gọi Gemini với các tầng dự phòng tự động
    const makePayload = (withSearch: boolean) => {
      const p: any = {
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1024,
        },
      };
      if (withSearch) {
        p.tools = [{ googleSearch: {} }];
      }
      return p;
    };

    // Ưu tiên các model siêu tốc (gemini-flash-lite-latest ~700ms) để đạt độ trễ thấp nhất
    const strategies = [
      { model: "gemini-flash-lite-latest", withSearch: false },
      { model: "gemini-3.5-flash-lite", withSearch: false },
      { model: "gemini-flash-latest", withSearch: false },
      { model: "gemini-3.5-flash", withSearch: false },
      { model: "gemini-3.5-flash", withSearch: true },
    ];

    let lastError = "";
    let data: any = null;
    let usedModel = "gemini-3.5-flash-lite";
    let usedSearch = false;

    modelLoop: for (const strat of strategies) {
      for (const key of apiKeys) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${strat.model}:generateContent?key=${key}`;
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(makePayload(strat.withSearch)),
          });

          if (res.ok) {
            data = await res.json();
            usedModel = strat.model;
            usedSearch = strat.withSearch;
            break modelLoop;
          } else {
            lastError = await res.text();
            console.warn(`[Chat API] ${strat.model} with key failed (${res.status}):`, lastError.slice(0, 100));
          }
        } catch (err: any) {
          lastError = err.message;
          console.warn(`[Chat API] ${strat.model} error:`, err.message);
        }
      }
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Hệ thống AI hiện đang tạm bận hạn mức miễn phí của Google. Bạn vui lòng thử lại sau 1 phút nhé!",
          raw: lastError,
        },
        { status: 429, headers: corsHeaders }
      );
    }

    const candidate = data.candidates?.[0];
    const answer =
      candidate?.content?.parts?.[0]?.text ||
      "Xin lỗi, hiện tại em chưa thể xử lý câu hỏi này. Bạn hãy thử đặt câu hỏi khác nhé.";

    // Trích xuất nguồn tin cậy từ Google Search Grounding (nếu có)
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const sources: ChatSource[] = [];

    groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        if (!sources.some((s) => s.uri === chunk.web.uri)) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
          });
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        answer,
        sources: sources.slice(0, 4),
        model: usedModel,
        groundedWithSearch: usedSearch && sources.length > 0,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Chat API Exception:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi hệ thống" },
      { status: 500, headers: corsHeaders }
    );
  }
}
