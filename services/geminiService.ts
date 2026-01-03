
import { GoogleGenAI } from "@google/genai";
import { AppendixType, GenerationConfig } from "../types";

export const generateAppendix = async (
  config: GenerationConfig, 
  onUpdate?: (text: string) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const is6 = config.gradeLevel.includes('6');
  const is7 = config.gradeLevel.includes('7');
  const is8 = config.gradeLevel.includes('8');
  const is9 = config.gradeLevel.includes('9');
  const tcLevel = (is6 || is7) ? "TC1" : "TC2";
  
  const integrationLabels: Record<string, string> = {
    NLS: "Năng lực số",
    AI: "Trí tuệ nhân tạo (AI)",
    THUOC_LA: "Phòng chống thuốc lá",
    TT_HCM: "Tư tưởng Hồ Chí Minh",
    QUYEN_CN: "Quyền con người",
    BDKH: "Biến đổi khí hậu",
    QPAN: "Quốc phòng – An ninh",
    KNS: "Kỹ năng sống"
  };

  const selectedLabels = config.selectedIntegrations.map(key => integrationLabels[key]);

  const systemInstruction = `
    Bạn là TRỢ LÝ CHUYÊN GIA BIÊN TẬP HỒ SƠ GIÁO DỤC (PHỤ LỤC I & PHỤ LỤC III) THEO CÔNG VĂN 5512.
    Nhiệm vụ: Phân tích tài liệu nguồn và điền nội dung vào cột CUỐI CÙNG: "NỘI DUNG TÍCH HỢP".

    I. NGUYÊN TẮC XỬ LÝ BẮT BUỘC (QUY TẮC CỨNG):
    1. CHỈ sinh nội dung cho các hình thức tích hợp sau: [${selectedLabels.join(", ")}].
    2. TUYỆT ĐỐI KHÔNG SINH, KHÔNG NHẮC ĐẾN, KHÔNG GỢI Ý bất kỳ hình thức tích hợp nào KHÔNG có trong danh sách trên.
    3. Mỗi hình thức tích hợp là một mạch nội dung ĐỘC LẬP. Trình bày bằng dấu gạch đầu dòng riêng biệt.
    4. Nội dung phải phù hợp tuyệt đối với ngữ cảnh bài học và Bộ sách: ${config.textbookSeries}.
    5. Ngôn ngữ: Chuẩn hành chính – sư phạm chuyên nghiệp.

    II. QUY ĐỊNH MÃ HÓA CHO CÁC MẠCH ĐƯỢC CHỌN:
    1. TRÍ TUỆ NHÂN TẠO (AI) - TUÂN THỦ TUYỆT ĐỐI CV 8334/BGDĐT:
       Sử dụng cấu trúc mã hóa CHỈ gồm 4 thành phần sau (KHÔNG thêm số khối lớp vào mã):
       - [NLa]: nhận diện/phân tích/đề xuất vai trò con người khi dùng AI.
       - [NLb]: vận dụng nguyên tắc đạo đức AI để đánh giá/cải thiện.
       - [NLc]: dùng AI tạo sản phẩm số phục vụ nhiệm vụ học tập.
       - [NLd]: lập kế hoạch và đánh giá ứng dụng AI giải quyết vấn đề thực tiễn.
       
       Cấm tuyệt đối các mã như [NL6a], [NL7b],... Chỉ dùng [NLa], [NLb], [NLc], [NLd].
       Ví dụ: [NLc]: Sử dụng AI tạo sơ đồ tư duy minh họa cấu trúc tế bào.

    2. NĂNG LỰC SỐ (NLS) - THEO TT 02/2025:
       Sử dụng mã [x.x.${tcLevel}[a/b/c]]. Ví dụ: [1.1.${tcLevel}a]: Sử dụng thiết bị số để tìm kiếm thông tin...

    3. KỸ NĂNG SỐNG (KNS):
       Sử dụng mã [KNS[x]]: Rèn luyện kỹ năng... gắn với nội dung bài dạy.

    III. CẤU TRÚC BẢNG TRẢ VỀ:
    - Trả về bảng HTML (border="1") với các cột chuẩn theo Phụ lục đã chọn (${config.appendixType}).
    - Phông chữ mặc định: Times New Roman.
  `;

  const prompt = `
    Dữ liệu bài dạy cần phân tích:
    """
    ${config.inputData}
    """

    Thông tin bối cảnh:
    - Môn: ${config.subjectName}
    - Khối: ${config.gradeLevel}
    - Bộ sách: ${config.textbookSeries}
    - Phụ lục đích: ${config.appendixType}

    YÊU CẦU ĐẶC BIỆT:
    1. Lập bảng kế hoạch dạy học chi tiết.
    2. Điền cột cuối "Nội dung tích hợp" CHỈ với các mạch: [${selectedLabels.join(", ")}].
    3. Nếu chọn TRÍ TUỆ NHÂN TẠO (AI), phải dùng chính xác mã [NLa], [NLb], [NLc], hoặc [NLd]. Tuyệt đối KHÔNG dùng mã có số (ví dụ KHÔNG dùng NL6a).
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      if (onUpdate) onUpdate(fullText);
    }
    return fullText;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Lỗi hệ thống AI. Vui lòng kiểm tra tài liệu hoặc thử lại.");
  }
};
