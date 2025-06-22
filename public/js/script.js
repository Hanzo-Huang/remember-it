document.addEventListener("DOMContentLoaded", () => {
  const questionEl = document.getElementById("question");
  const userAnswerEl = document.getElementById("userAnswer");
  const checkAnswerBtn = document.getElementById("checkAnswer");
  const nextQuestionBtn = document.getElementById("nextQuestion");
  const correctAnswerEl = document.getElementById("correctAnswer");
  const subjectFilter = document.getElementById("subjectFilter");
  const chapterFilter = document.getElementById("chapterFilter");
  const typeFilter = document.getElementById("typeFilter");
  const applyFilterBtn = document.getElementById("applyFilter");

  let currentQuestion = null;

  // 初始化加载筛选器和题目
  loadFilters().then(showNewQuestion);

  // 加载筛选选项
  async function loadFilters() {
    try {
      const response = await fetch("/api/categories");
      const { subjects, chapters, questionTypes } = await response.json();

      // 填充科目筛选
      subjectFilter.innerHTML = '<option value="">所有科目</option>' + 
        subjects.map(subject => `<option value="${subject}">${subject}</option>`).join("");

      // 填充章节筛选
      chapterFilter.innerHTML = '<option value="">所有章节</option>' + 
        chapters.map(chapter => `<option value="${chapter}">${chapter}</option>`).join("");

      // 填充题型筛选
      typeFilter.innerHTML = '<option value="">所有题型</option>' + 
        questionTypes.map(type => `<option value="${type}">${type}</option>`).join("");
    } catch (error) {
      console.error("加载筛选条件失败:", error);
    }
  }

  // 获取随机题目
  async function fetchRandomQuestion() {
    const params = new URLSearchParams();
    if (subjectFilter.value) params.append("subject", subjectFilter.value);
    if (chapterFilter.value) params.append("chapter", chapterFilter.value);
    if (typeFilter.value) params.append("type", typeFilter.value);

    try {
      const response = await fetch(`/api/questions/random?${params.toString()}`);
      if (!response.ok) throw new Error("获取题目失败");
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      return { term: "无法加载题目，请刷新重试", definition: "" };
    }
  }

  // 显示新题目
  async function showNewQuestion() {
    userAnswerEl.value = "";
    correctAnswerEl.style.display = "none";
    correctAnswerEl.innerHTML = "";

    currentQuestion = await fetchRandomQuestion();
    questionEl.textContent = currentQuestion.term;
    correctAnswerEl.dataset.answer = currentQuestion.definition;
    userAnswerEl.focus();
  }

  // 比较答案
  function compareAnswers(userAnswer, correctAnswer) {
    const similarity = stringSimilarity.compareTwoStrings(userAnswer, correctAnswer);

    try {
      const diff = Diff.diffWords(correctAnswer, userAnswer);
      let highlighted = "";
      
      diff.forEach((part) => {
        const color = part.added ? "missing" : part.removed ? "" : "correct";
        if (color) {
          highlighted += `<span class="${color}">${part.value}</span>`;
        } else {
          highlighted += part.value;
        }
      });

      return { highlighted, similarity };
    } catch (e) {
      console.error("比较出错:", e);
      return { highlighted: correctAnswer, similarity: 0 };
    }
  }

  // 检查答案
  function checkAnswer() {
    const userAnswer = userAnswerEl.value.trim();
    const correctAnswer = correctAnswerEl.dataset.answer;

    if (!userAnswer) {
      alert("请先输入你的答案");
      return;
    }

    const { highlighted, similarity } = compareAnswers(userAnswer, correctAnswer);

    correctAnswerEl.innerHTML = `
      <strong>标准答案：</strong>
      <div class="answer-text">${highlighted}</div>
      <div class="feedback">
        匹配度: <span class="${getSimilarityClass(similarity)}">${Math.round(similarity * 100)}%</span>
        ${similarity === 1 ? "🎉 完全正确！" : ""}
      </div>
    `;
    correctAnswerEl.style.display = "block";
  }

  function getSimilarityClass(similarity) {
    if (similarity >= 0.8) return "high";
    if (similarity >= 0.5) return "medium";
    return "low";
  }

  // 事件监听
  checkAnswerBtn.addEventListener("click", checkAnswer);
  nextQuestionBtn.addEventListener("click", showNewQuestion);
  applyFilterBtn.addEventListener("click", showNewQuestion);
  subjectFilter.addEventListener("change", showNewQuestion);
  chapterFilter.addEventListener("change", showNewQuestion);
  typeFilter.addEventListener("change", showNewQuestion);

  // 支持Ctrl+Enter检查答案
  userAnswerEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      checkAnswer();
    }
  });
});