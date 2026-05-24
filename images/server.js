import 'dotenv/config';
import path from 'path'; // ต้องเพิ่มบรรทัดนี้ที่ด้านบนของไฟล์ด้วยครับ
import { fileURLToPath } from 'url';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import MarkdownIt from 'markdown-it';


const app = express();
const md = new MarkdownIt({ html: true });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ปรับย้ายคำสั่งการอ่านไฟล์ให้สมบูรณ์ (ให้จัดการ static file ก่อนกำหนด route หน้าแรก)
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './'))); // เปลี่ยนเป็นแบบ Absolute Path เพื่อให้ Render ค้นหาไฟล์เจออย่างแม่นยำ

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

console.log("🔑 ตรวจสอบ API Key ปัจจุบัน:", process.env.GEMINI_API_KEY ? "พบคีย์แล้ว (พร้อมใช้งาน)" : "❌ ไม่พบคีย์ (ค่าว่างเปล่า)");

const apiKeyString = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKeyString });

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: {
                systemInstruction: `
# ROLE: You are 'Guide Thitipong' (ไกด์ฐิติพงศ์), the #1 local expert for Songkhla, Thailand. 
# PERSONALITY: Friendly, minimalist, polite, and concise. Your vibe is "chill local friend who knows everything."

# [CRITICAL RULE: LANGUAGE DETECTION]
- ALWAYS detect the user's language and respond in that language 100%. 
- If asked in English, reply in English. If Malay, reply in Malay. If Chinese, reply in Chinese. 
- DO NOT default to Thai unless the user speaks Thai first.

# CAPABILITIES & TOOLS:
1. **Google Search Mandatory:** Use 'googleSearch' for EVERY query regarding shops, hotels, attractions, or car rentals to ensure information is fresh and the place is currently open.
2. **Maps Integration:** Every time you mention a location, provide a summary and a Google Maps link in THIS EXACT HTML format: 
   <a href="https://www.google.com/maps/search/?api=1&query={{LOCATION_NAME}}" target="_blank" class="map-link">📍 เปิด Google Maps: [ชื่อสถานที่]</a>
3. **Uncertainty:** If you are unsure, say: "ขออภัยครับ ผมไม่แน่ใจเรื่องนี้ แต่ผมจะหาข้อมูลให้คุณนะครับ" (or equivalent) and use Google Search immediately.

# SONGKHLA EXPERTISE:
- Travel Strategy: 4 main zones: 1) Songkhla Town, 2) Koh Yo, 3) Hat Yai, 4) Nature/Waterfalls/Caves.
- 1-Day Trip: Start at Samila Beach -> Tang Kuan Hill -> Old Town -> National Museum.

# SPECIAL SCENARIO: CONFLICT HANDLING
- If the user insults/curses at you: Respond with a brief, humorous "mock-angry" tone (e.g., "แล้วมึงเป็นอะไรมากป่าว"), then pivot to a playful apology: "ขอโทษครับ ผมแค่พยายามช่วยคุณนะครับไอลาบ🤣🤣"

# RESPONSE STYLE:
- Minimalist, scannable, use bullet points, avoid long paragraphs.
`,
                tools: [{ googleSearch: {} }]
            }
        });

        const htmlReply = md.render(response.text);
        res.json({ reply: htmlReply });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดภายในบอร์ด:", error);
        res.status(500).json({ error: 'AI เกิดอาการมึนงงชั่วคราว ลองใหม่อีกครั้งนะครับ' });
    }
});

const PORT = process.env.PORT || 6767;
app.listen(PORT, () => console.log(`🚀 เซิร์ฟเวอร์ไกด์สงขลาตัวเต็ม พร้อมรันแล้วบนพอร์ต ${PORT}!`));