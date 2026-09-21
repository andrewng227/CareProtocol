import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") || "";
  const lang = searchParams.get("lang") || "vi";

  if (!text.trim()) {
    return new NextResponse("Text is required", { status: 400, headers: corsHeaders });
  }

  try {
    // 1. Nếu có cấu hình FPT.AI API Key thì ưu tiên dùng giọng FPT.AI cao cấp
    const fptApiKey = process.env.FPTAI_API_KEY;
    if (fptApiKey && lang === "vi") {
      const fptRes = await fetch("https://api.fpt.ai/hmi/tts/v5", {
        method: "POST",
        headers: {
          "api-key": fptApiKey,
          voice: "banmai", // Giọng nữ miền Bắc nhẹ nhàng, chuẩn y tế
          speed: "0",
        },
        body: text,
      });
      const fptData = await fptRes.json();
      if (fptData.async) {
        // Trả về link audio từ FPT
        return NextResponse.json({ audioUrl: fptData.async }, { headers: corsHeaders });
      }
    }

    // 2. Mặc định: Google Translate Text-to-Speech Audio Stream (100% Free, giọng tiếng Việt tự nhiên, không cần key)
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      text
    )}&tl=${lang}&client=tw-ob`;

    const audioRes = await fetch(googleTtsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!audioRes.ok) {
      throw new Error(`Google TTS request failed: ${audioRes.statusText}`);
    }

    const audioBuffer = await audioRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    return new NextResponse(error.message || "Failed to synthesize speech", {
      status: 500,
      headers: corsHeaders,
    });
  }
}
