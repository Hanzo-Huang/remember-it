const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data/questions.json");
const CATEGORIES_FILE = path.join(__dirname, "data/categories.json");

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// 确保数据目录和文件存在
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}
if (!fs.existsSync(CATEGORIES_FILE)) {
  fs.writeFileSync(
    CATEGORIES_FILE,
    JSON.stringify({
      subjects: [],
      chapters: [],
      questionTypes: [],
    })
  );
}

// 读取问题数据
function readQuestions() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("读取题目失败:", error);
    return [];
  }
}

// 写入问题数据
function writeQuestions(questions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2));
}

// 更新分类
function updateCategories(newCategories) {
  const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf8"));

  ["subjects", "chapters", "questionTypes"].forEach((type) => {
    const value = newCategories[type];
    if (value && !categories[type].includes(value)) {
      categories[type].push(value);
      categories[type].sort(); // 保持分类有序
    }
  });

  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
}

// API路由

// 获取分类
app.get("/api/categories", (req, res) => {
  try {
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf8"));
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "读取分类失败" });
  }
});

// 添加问题
app.post("/api/questions", (req, res) => {
  const { term, definition, subject, chapter, questionType } = req.body;

  if (!term || !definition || !subject || !chapter || !questionType) {
    return res.status(400).json({ error: "请填写所有必填字段" });
  }

  const questions = readQuestions();
  const newQuestion = {
    term,
    definition,
    subject,
    chapter,
    questionType,
    createdAt: new Date().toISOString(),
  };
  questions.push(newQuestion);
  writeQuestions(questions);

  // 更新分类
  updateCategories({
    subjects: subject,
    chapters: chapter,
    questionTypes: questionType,
  });

  res.json({ success: true });
});

// 获取随机问题（带筛选）
app.get("/api/questions/random", (req, res) => {
  const { subject, chapter, type } = req.query;
  let questions = readQuestions();

  if (subject) questions = questions.filter((q) => q.subject === subject);
  if (chapter) questions = questions.filter((q) => q.chapter === chapter);
  if (type) questions = questions.filter((q) => q.questionType === type);

  if (questions.length === 0) {
    return res.status(404).json({ error: "没有符合条件的题目" });
  }

  const randomIndex = Math.floor(Math.random() * questions.length);
  res.json(questions[randomIndex]);
});

// 获取分页问题
app.get("/api/questions/paged", (req, res) => {
  const { subject, chapter, type, page = 1 } = req.query;
  let questions = readQuestions();

  // 应用筛选
  if (subject) questions = questions.filter((q) => q.subject === subject);
  if (chapter) questions = questions.filter((q) => q.chapter === chapter);
  if (type) questions = questions.filter((q) => q.questionType === type);

  // 分页处理
  const pageSize = 10;
  const totalPages = Math.ceil(questions.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedQuestions = questions.slice(startIndex, endIndex);

  res.json({
    questions: pagedQuestions,
    total: questions.length,
    page: parseInt(page),
    totalPages,
  });
});

// 在前端路由部分添加
app.get("/browse", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "browse.html"));
});

// 前端路由
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/add", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add.html"));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
