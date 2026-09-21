import { NextResponse } from "next/server";

export interface ClinicalStudy {
  id: string;
  title: string;
  source: string;
  pubDate: string;
  url: string;
  type: "pubmed" | "clinicaltrial";
}

export interface WgerExercise {
  id: number;
  name: string;
  category: string;
  description: string;
  muscles: string[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const protocol = searchParams.get("protocol") || "acl";

  // Ánh xạ chuyên khoa sang ID danh mục bài tập Wger và từ khóa PubMed NIH
  const protocolMapping: Record<string, { wgerCategory: number; defaultQuery: string; categoryName: string }> = {
    acl: {
      wgerCategory: 9, // Legs
      defaultQuery: "knee flexion post surgery rehabilitation anterior cruciate ligament",
      categoryName: "Chân & Khớp gối (Legs / Knee Rehab)"
    },
    stroke: {
      wgerCategory: 13, // Shoulders
      defaultQuery: "stroke upper limb rehabilitation shoulder mobility exercise",
      categoryName: "Khớp vai & Cánh tay (Shoulders & Arms)"
    },
    csection: {
      wgerCategory: 10, // Abs
      defaultQuery: "cesarean section postoperative recovery core diaphragmatic exercise",
      categoryName: "Cơ thẳng bụng & Khung chậu (Abs & Pelvic Floor)"
    },
    laparoscopy: {
      wgerCategory: 14, // Calves
      defaultQuery: "laparoscopy deep vein thrombosis prevention ankle exercise",
      categoryName: "Bắp chân & Cổ chân (Calves / Ankle Pumps)"
    },
    spine: {
      wgerCategory: 12, // Back
      defaultQuery: "lumbar disc herniation physical therapy spine alignment posture",
      categoryName: "Lưng & Cột sống (Back & Spine Alignment)"
    }
  };

  const selectedProtoInfo = protocolMapping[protocol] || protocolMapping.acl;
  const query = searchParams.get("query") || selectedProtoInfo.defaultQuery;
  const mode = searchParams.get("mode") || "all"; // "studies" | "exercises" | "all"

  const ncbiApiKey = process.env.NCBI_API_KEY || "";
  const wgerApiKey = process.env.WGER_API_KEY || "";

  try {
    let studies: ClinicalStudy[] = [];
    let exercises: WgerExercise[] = [];

    // 1. LẤY BÀI BÁO Y KHOA TỪ NIH PUBMED (Dùng NCBI Key của anh)
    if (mode === "studies" || mode === "all") {
      const ncbiApiKeyParam = ncbiApiKey ? `&api_key=${ncbiApiKey}` : "";
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(
        query
      )}&retmode=json&retmax=4${ncbiApiKeyParam}`;

      const ncbiRes = await fetch(searchUrl, { next: { revalidate: 3600 } });
      const ncbiData = await ncbiRes.json();
      const idList: string[] = ncbiData.esearchresult?.idlist || [];

      if (idList.length > 0) {
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${idList.join(
          ","
        )}&retmode=json${ncbiApiKeyParam}`;
        const sumRes = await fetch(summaryUrl);
        const sumData = await sumRes.json();

        studies = idList.map((id) => {
          const item = sumData.result?.[id] || {};
          return {
            id: `PMC${id}`,
            title: item.title || "Clinical Evaluation of Rehab Protocol",
            source: item.source || "National Institutes of Health (NIH)",
            pubDate: item.pubdate || "Recent",
            url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${id}/`,
            type: "pubmed",
          };
        });
      }

      // Thêm dữ liệu thử nghiệm lâm sàng ClinicalTrials.gov
      try {
        const ctUrl = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(
          query
        )}&pageSize=2`;
        const ctRes = await fetch(ctUrl, { next: { revalidate: 3600 } });
        if (ctRes.ok) {
          const ctData = await ctRes.json();
          const studiesList = ctData.studies || [];
          studiesList.forEach((s: any) => {
            const nctId = s.protocolSection?.identificationModule?.nctId;
            const briefTitle = s.protocolSection?.identificationModule?.briefTitle;
            const leadSponsor =
              s.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name;
            if (nctId && briefTitle) {
              studies.push({
                id: nctId,
                title: briefTitle,
                source: leadSponsor || "ClinicalTrials.gov Protocol",
                pubDate: "Active Clinical Study",
                url: `https://clinicaltrials.gov/study/${nctId}`,
                type: "clinicaltrial",
              });
            }
          });
        }
      } catch (ctErr) {
        console.warn("ClinicalTrials.gov fetch fallback:", ctErr);
      }
    }

    // 2. LẤY THƯ VIỆN BÀI TẬP TỪ WGER API (Dùng WGER Key của anh)
    if (mode === "exercises" || mode === "all") {
      try {
        const headers: Record<string, string> = {
          Accept: "application/json",
        };
        if (wgerApiKey) {
          headers["Authorization"] = `Token ${wgerApiKey}`;
        }

        // Lấy bài tập theo category tương ứng của phẫu thuật từ wger
        const wgerUrl = `https://wger.de/api/v2/exerciseinfo/?category=${selectedProtoInfo.wgerCategory}&limit=6`;
        const wgerRes = await fetch(wgerUrl, {
          headers,
          next: { revalidate: 3600 },
        });

        if (wgerRes.ok) {
          const wgerData = await wgerRes.json();
          exercises = (wgerData.results || []).map((item: any) => {
            // Lấy mô tả tiếng Anh hoặc bản dịch đầu tiên
            const enTrans = item.translations?.find((t: any) => t.language === 2) || item.translations?.[0];
            const cleanDesc = (enTrans?.description || item.description || "")
              .replace(/<[^>]*>?/gm, "")
              .replace(/&nbsp;/g, " ")
              .trim();

            return {
              id: item.id,
              name: enTrans?.name || item.name || "Rehabilitation Exercise",
              category: item.category?.name || selectedProtoInfo.categoryName,
              description: cleanDesc || "Bài tập phục hồi chức năng thể chất chính quy.",
              muscles: (item.muscles || []).map((m: any) => m.name_en || m.name),
              wgerUrl: `https://wger.de/en/exercise/${item.id}/view/`,
            };
          });
        }
      } catch (wgerErr) {
        console.warn("wger API fetch notice:", wgerErr);
      }
    }

    return NextResponse.json({
      success: true,
      query,
      apiKeys: {
        ncbi: Boolean(ncbiApiKey),
        wger: Boolean(wgerApiKey),
      },
      sources: [
        "NIH PubMed Central",
        "ClinicalTrials.gov",
        "wger Exercise Database",
      ],
      studies,
      exercises,
    });
  } catch (error: any) {
    console.error("Clinical API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch medical guidelines",
      },
      { status: 500 }
    );
  }
}
