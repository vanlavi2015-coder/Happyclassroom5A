const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public"), { maxAge: 0 }));

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || (fs.existsSync("/var/data") ? "/var/data" : path.join(__dirname, "data"));
const DATA_FILE = path.join(DATA_DIR, "lop-hoc-5a.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

const seedQuestions = [
  { id:"q1", subject:"Toán", grade:5, lesson:"Số thập phân", type:"mcq", question:"Số nào bằng 3,5?", options:["3,05","3,50","35,0","0,35"], answer:1, explanation:"3,5 = 3,50 vì thêm chữ số 0 ở tận cùng phần thập phân không làm đổi giá trị.", level:"Cơ bản" },
  { id:"q2", subject:"Toán", grade:5, lesson:"Diện tích hình thang", type:"mcq", question:"Công thức tính diện tích hình thang là gì?", options:["Đáy lớn × đáy bé","(Đáy lớn + đáy bé) × chiều cao : 2","Đáy × chiều cao","Cạnh × cạnh"], answer:1, explanation:"Diện tích hình thang bằng tổng hai đáy nhân chiều cao rồi chia 2.", level:"Cơ bản" },
  { id:"q3", subject:"Tiếng Việt", grade:5, lesson:"Từ đồng nghĩa", type:"mcq", question:"Từ nào đồng nghĩa với “chăm chỉ”?", options:["Lười biếng","Siêng năng","Nóng nảy","Chậm chạp"], answer:1, explanation:"Siêng năng có nghĩa gần giống chăm chỉ.", level:"Cơ bản" },
  { id:"q4", subject:"Toán", grade:5, lesson:"Phân số", type:"mcq", question:"Phân số nào bằng 1/2?", options:["2/3","3/6","4/6","5/8"], answer:1, explanation:"3/6 rút gọn bằng 1/2.", level:"Vận dụng" },
  { id:"q5", subject:"Khoa học", grade:5, lesson:"Môi trường", type:"mcq", question:"Việc làm nào góp phần bảo vệ môi trường?", options:["Vứt rác xuống suối","Đốt rác nhựa tùy tiện","Phân loại rác","Chặt cây non"], answer:2, explanation:"Phân loại rác giúp tái sử dụng, tái chế và xử lý rác phù hợp.", level:"Cơ bản" }
];

function readStore() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { questions: Array.isArray(parsed.questions) ? parsed.questions : seedQuestions, games: parsed.games || [], results: parsed.results || [] };
  } catch {
    return { questions: seedQuestions, games: [], results: [] };
  }
}
let store = readStore();
function saveStore() {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}
function teacherOnly(req, res, next) {
  const expected = process.env.TEACHER_PIN;
  if (!expected) return res.status(503).json({ error: "Chưa cấu hình TEACHER_PIN trong Render." });
  const provided = String(req.headers["x-teacher-pin"] || "");
  const a = Buffer.from(provided), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: "Mã giáo viên chưa đúng." });
  next();
}
app.get("/api/health", (_req, res) => res.json({ ok: true, app: "LopHoc5A" }));
app.get("/api/state", (_req, res) => res.json({ questions: store.questions, games: store.games, results: store.results.slice(-100) }));
app.post("/api/questions", teacherOnly, (req, res) => {
  const q = req.body || {};
  if (!q.question || !Array.isArray(q.options) || q.options.length < 2 || !Number.isInteger(Number(q.answer))) return res.status(400).json({ error: "Cần có câu hỏi, ít nhất 2 lựa chọn và đáp án đúng." });
  const item = { id: crypto.randomUUID(), subject: String(q.subject || "Toán"), grade: 5, lesson: String(q.lesson || ""), type: "mcq", question: String(q.question), options: q.options.map(String).slice(0, 6), answer: Number(q.answer), explanation: String(q.explanation || ""), level: String(q.level || "Cơ bản") };
  if (item.answer < 0 || item.answer >= item.options.length) return res.status(400).json({ error: "Vị trí đáp án không hợp lệ." });
  store.questions.push(item); saveStore(); res.json({ ok: true, question: item });
});
app.delete("/api/questions/:id", teacherOnly, (req, res) => {
  const before = store.questions.length;
  store.questions = store.questions.filter(q => q.id !== req.params.id);
  if (before === store.questions.length) return res.status(404).json({ error: "Không tìm thấy câu hỏi." });
  saveStore(); res.json({ ok: true });
});
app.post("/api/games", teacherOnly, (req, res) => {
  const { title, gameType, questionIds, mode } = req.body || {};
  const selected = store.questions.filter(q => Array.isArray(questionIds) && questionIds.includes(q.id));
  if (!title || !selected.length) return res.status(400).json({ error: "Đặt tên trò chơi và chọn ít nhất một câu hỏi." });
  const game = { id: crypto.randomUUID(), title: String(title), gameType: String(gameType || "wheel"), mode: mode === "teams" ? "teams" : "individual", questionIds: selected.map(q => q.id), createdAt: new Date().toISOString(), active: true };
  store.games.push(game); saveStore(); res.json({ ok: true, game });
});
app.post("/api/results", (req, res) => {
  const { gameId, playerName, score, correct, total } = req.body || {};
  if (!playerName || !Number.isFinite(Number(score)) || !Number.isFinite(Number(correct)) || !Number.isFinite(Number(total))) return res.status(400).json({ error: "Thiếu thông tin kết quả." });
  const result = { id: crypto.randomUUID(), gameId: String(gameId || ""), playerName: String(playerName).slice(0, 60), score: Math.max(0, Number(score)), correct: Math.max(0, Number(correct)), total: Math.max(1, Number(total)), playedAt: new Date().toISOString() };
  store.results.push(result); saveStore(); res.json({ ok: true, result });
});
app.post("/api/ai/create-game", teacherOnly, async (req, res) => {
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "Chưa cấu hình OPENAI_API_KEY. Cô vẫn có thể dùng ngân hàng câu hỏi có sẵn." });
  const prompt = String(req.body?.prompt || "").trim();
  if (!prompt) return res.status(400).json({ error: "Hãy nhập yêu cầu tạo trò chơi." });
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: `Tạo bộ 8 câu hỏi trắc nghiệm phù hợp học sinh lớp 5, bằng tiếng Việt, theo yêu cầu: ${prompt}. Chỉ trả về JSON array, mỗi phần tử gồm subject, lesson, question, options (4 chuỗi), answer (chỉ số 0-3), explanation, level. Không thêm markdown.`
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data.error?.message || "AI chưa tạo được câu hỏi." });
    const output = (data.output || []).flatMap(x => x.content || []).filter(x => x.type === "output_text").map(x => x.text).join("\n");
    const clean = output.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const questions = JSON.parse(clean);
    if (!Array.isArray(questions)) throw new Error("Định dạng câu hỏi không hợp lệ.");
    const added = questions.slice(0, 12).map(q => ({ id: crypto.randomUUID(), subject: String(q.subject || "Toán"), grade: 5, lesson: String(q.lesson || ""), type: "mcq", question: String(q.question || ""), options: Array.isArray(q.options) ? q.options.map(String).slice(0,4) : [], answer: Number(q.answer), explanation: String(q.explanation || ""), level: String(q.level || "Cơ bản") })).filter(q => q.question && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
    store.questions.push(...added); saveStore(); res.json({ ok: true, count: added.length, questions: added });
  } catch (e) { res.status(502).json({ error: "Không đọc được kết quả AI: " + e.message }); }
});
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`Lớp học 5A listening on ${PORT}; data=${DATA_FILE}`));
