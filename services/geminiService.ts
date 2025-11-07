import { GoogleGenAI, Type } from "@google/genai";
import type { LessonPlanInput, FileWithPreview, LessonPlan } from '../types';

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use a lightweight, low-cost call to verify the key is valid.
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'hello',
    });
    return true;
  } catch (error) {
    console.error("API Key validation failed:", error);
    return false;
  }
};


const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      mimeType: file.type,
      data: base64EncodedData,
    },
  };
};

const lessonPlanObjectSchema = {
  type: Type.OBJECT,
  properties: {
    template: { type: Type.STRING, description: "Loại mẫu giáo án, phải là 'cv1001' hoặc 'cv5512'." },
    subject: { type: Type.STRING, description: "Môn học" },
    grade: { type: Type.STRING, description: "Lớp học" },
    lessonTitle: { type: Type.STRING, description: "Tên bài học" },
    periods: { type: Type.INTEGER, description: "Tổng số tiết của toàn bộ bài học này." },
    executionTime: { type: Type.STRING, description: "Thời gian thực hiện cho tiết học cụ thể này. Định dạng 'Tiết [số] - Tuần [số]'." },
    requiredOutcomes: {
      type: Type.OBJECT,
      properties: {
        knowledge: { type: Type.STRING, description: "Về kiến thức (chỉ dành cho mẫu CV5512)." },
        generalCompetencies: { type: Type.STRING, description: "Các năng lực chung." },
        specificCompetencies: { type: Type.STRING, description: "Các năng lực đặc thù của môn học (dành cho mẫu CV1001)." },
        qualities: { type: Type.STRING, description: "Các phẩm chất cần hình thành." },
        integratedContent: { type: Type.STRING, description: "Nội dung tích hợp (nếu có, dành cho mẫu CV1001)." },
      },
      required: ['generalCompetencies', 'qualities']
    },
    teachingAids: {
      type: Type.OBJECT,
      properties: {
        teacher: { type: Type.STRING, description: "Đồ dùng của giáo viên." },
        student: { type: Type.STRING, description: "Đồ dùng của học sinh." },
      },
      required: ['teacher', 'student']
    },
    teachingActivities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          activityName: { type: Type.STRING, description: "Tên hoạt động chính." },
          objective: { type: Type.STRING, description: "Mục tiêu của hoạt động." },
          // CV1001 specific
          teacherActivity: { type: Type.STRING, description: "Hoạt động của giáo viên (chỉ dành cho mẫu CV1001)." },
          studentActivity: { type: Type.STRING, description: "Hoạt động của học sinh (chỉ dành cho mẫu CV1001)." },
          // CV5512 specific
          content: { type: Type.STRING, description: "Nội dung hoạt động (chỉ dành cho mẫu CV5512)." },
          product: { type: Type.STRING, description: "Sản phẩm học tập mong đợi (chỉ dành cho mẫu CV5512)." },
          implementation: { type: Type.STRING, description: "Các bước tổ chức thực hiện (chỉ dành cho mẫu CV5512)." },
        },
        required: ['activityName', 'objective']
      },
    },
    postLessonAdjustments: { type: Type.STRING, description: "Nội dung rút kinh nghiệm. Trả về chuỗi rỗng ''." },
  },
  required: ['template', 'subject', 'grade', 'lessonTitle', 'periods', 'executionTime', 'requiredOutcomes', 'teachingAids', 'teachingActivities', 'postLessonAdjustments']
};

const lessonPlanSchema = {
    type: Type.ARRAY,
    items: lessonPlanObjectSchema,
};

const getPrompt = (data: LessonPlanInput, files: FileWithPreview[], locale: 'vi' | 'en') => {
    const commonInstructions = `
      - Teacher: ${data.teacherName}
      - Subject: ${data.subject}
      - Grade: ${data.grade}
      - Total required periods: ${data.periods}
      - Attached files: ${files.length > 0 ? files.map(f => f.name).join(', ') : 'None'}
      - Language for generated content: ${locale === 'vi' ? 'Vietnamese' : 'English'}

      VERY IMPORTANT REQUIREMENTS:
      1.  **AUTOMATICALLY DETERMINE THE LESSON:** Based on the given Subject and Grade, automatically determine the most suitable lesson title (including the lesson number, e.g., "Lesson 10: Green Trees") according to the current curriculum distribution.
      2.  **CREATE A LESSON PLAN FOR EACH PERIOD:** Based on the "Total required periods" of ${data.periods}, create a COMPLETE and SEPARATE lesson plan object for EACH PERIOD in the output JSON array.
      3.  **Content Allocation:** Allocate content and teaching activities logically across the periods to ensure the continuity and completeness of the entire lesson.
      4.  **File Integration (MANDATORY):** If there are attachments, you MUST analyze the content. Based on this, the teacher will ask questions directly related to the file's content, and students will answer, highlighting knowledge from the file. Mention the file name in the "Teaching Aids" section.
      5.  **OUTPUT FORMAT:** The result MUST be an ARRAY of JSON objects. Each object is a complete lesson plan for ONE PERIOD and must adhere to the provided schema.
    `;

    if (data.template === 'cv5512') {
        return `
        You are an expert in creating lesson plans according to the Vietnamese Ministry of Education and Training's standards.
        Your task is to create a detailed "Kế hoạch bài dạy" following the structure of Official Dispatch 5512/BGDĐT-GDTrH.

        Input Information:
        ${commonInstructions}
        - Lesson Plan Template: CV 5512

        SPECIFIC REQUIREMENTS FOR CV 5512:
        1.  **JSON 'template' field:** The 'template' field in the JSON output for each lesson plan object MUST be "cv5512".
        2.  **Structure:** Each lesson plan must follow this structure: I. MỤC TIÊU (Objectives), II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU (Aids), III. TIẾN TRÌNH DẠY HỌC (Teaching Process), IV. ĐIỀU CHỈNH SAU BÀI DẠY (Adjustments).
        3.  **MỤC TIÊU (\`requiredOutcomes\`):** Must include:
            - \`knowledge\`: State what students will know or understand.
            - \`generalCompetencies\`: List the general competencies. For specific competencies, integrate their elements into the activities description instead of listing them here.
            - \`qualities\`: List the personal qualities to be developed.
        4.  **TIẾN TRÌNH DẠY HỌC (\`teachingActivities\`):** This is the most important section. Create exactly 4 activity objects:
            - Activity 1: HOẠT ĐỘNG 1: MỞ ĐẦU (KHỞI ĐỘNG)
            - Activity 2: HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI
            - Activity 3: HOẠT ĐỘNG 3: LUYỆN TẬP
            - Activity 4: HOẠT ĐỘNG 4: VẬN DỤNG
        5.  **Activity Object Structure:** For each of the 4 activities, you MUST provide these fields:
            - \`activityName\`: The full name of the activity (e.g., "HOẠT ĐỘNG 1: MỞ ĐẦU (KHỞI ĐỘNG)").
            - \`objective\`: The goal of this specific activity.
            - \`content\`: The core content, questions, or tasks for students.
            - \`product\`: The expected outcome or product from the students (e.g., answers, completed worksheet, presentation).
            - \`implementation\`: A detailed, step-by-step description of how the teacher organizes the activity and how students participate. Describe both teacher's and students' actions clearly.
        6.  **DO NOT USE CV1001 fields:** You MUST NOT populate the \`teacherActivity\` or \`studentActivity\` fields for any activity. Use \`content\`, \`product\`, and \`implementation\` instead. Do not populate \`specificCompetencies\` or \`integratedContent\` in the \`requiredOutcomes\`.
        `;
    }

    // Default to CV1001
    return `
    You are an expert in creating lesson plans according to the Vietnamese Ministry of Education and Training's standards.
    Your task is to create a detailed "Kế hoạch bài dạy" following the standard template (similar to CV 1001/2345).

    Input Information:
    ${commonInstructions}
    - Lesson Plan Template: CV 1001/2345 (Standard)

    SPECIFIC REQUIREMENTS FOR CV 1001/2345:
    1.  **JSON 'template' field:** The 'template' field in the JSON output for each lesson plan object MUST be "cv1001".
    2.  **Structure:** Each lesson plan must follow this structure: I. Yêu cầu cần đạt, II. Đồ dùng dạy học, III. Các hoạt động dạy học, IV. Điều chỉnh sau bài dạy.
    3.  **Yêu cầu cần đạt (\`requiredOutcomes\`):** Must include \`generalCompetencies\`, \`specificCompetencies\`, \`qualities\`, and \`integratedContent\` (if any).
    4.  **Các hoạt động dạy học (\`teachingActivities\`):** This section is the focus. It must include 4 activities with the exact Vietnamese names: "1. Hoạt động mở đầu", "2. Hình thành kiến thức mới", "3. Hoạt động luyện tập - thực hành", and "4. Hoạt động vận dụng".
    5.  **Activity Object Structure:** For each activity, you MUST provide:
        - \`activityName\`: The name of the activity.
        - \`objective\`: The goal of the activity.
        - \`teacherActivity\`: Describe the teacher's steps and instructions using modern teaching methods.
        - \`studentActivity\`: Describe the corresponding actions and expected responses from the students in detail.
    6.  **DO NOT USE CV5512 fields:** You MUST NOT populate the \`knowledge\`, \`content\`, \`product\`, or \`implementation\` fields. Use \`teacherActivity\` and \`studentActivity\` instead.
    `;
};


export const generateLessonPlan = async (data: LessonPlanInput, files: FileWithPreview[], locale: 'vi' | 'en', apiKey: string): Promise<LessonPlan[]> => {
  if (!apiKey) {
    throw new Error("API_KEY_INVALID");
  }
  const ai = new GoogleGenAI({ apiKey });

  const prompt = getPrompt(data, files, locale);

  const imageParts = await Promise.all(
    files.filter(file => file.type.startsWith('image/')).map(fileToGenerativePart)
  );

  const textParts = files
    .filter(file => file.type === 'application/pdf')
    .map(file => ({ text: `Nội dung tham khảo từ tệp PDF: ${file.name}` }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }, ...imageParts, ...textParts] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: lessonPlanSchema,
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result as LessonPlan[];
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('Requested entity was not found'))) {
        throw new Error("API_KEY_INVALID");
    }

    const errorMessage = locale === 'en' 
        ? "Could not generate lesson plan from AI. Please check the information and try again."
        : "Không thể tạo giáo án từ AI. Vui lòng kiểm tra lại thông tin và thử lại.";
    throw new Error(errorMessage);
  }
};
