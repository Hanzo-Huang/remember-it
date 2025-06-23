document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addQuestionForm");
  const termInput = document.getElementById("term");
  const definitionInput = document.getElementById("definition");
  const messageEl = document.getElementById("message");
  const subjectSelect = document.getElementById("subjectSelect");
  const subjectInput = document.getElementById("subjectInput");
  const chapterSelect = document.getElementById("chapterSelect");
  const chapterInput = document.getElementById("chapterInput");
  const questionTypeSelect = document.getElementById("questionTypeSelect");
  const questionTypeInput = document.getElementById("questionTypeInput");

  // 从本地存储加载上次使用的分类
  function loadLastUsedCategories() {
    const lastUsed = JSON.parse(localStorage.getItem('lastUsedCategories')) || {};
    
    if (lastUsed.subject) {
      subjectInput.value = lastUsed.subject;
      subjectSelect.value = "";
    }
    if (lastUsed.chapter) {
      chapterInput.value = lastUsed.chapter;
      chapterSelect.value = "";
    }
    if (lastUsed.questionType) {
      questionTypeInput.value = lastUsed.questionType;
      questionTypeSelect.value = "";
    }
  }

  // 保存当前使用的分类到本地存储
  function saveLastUsedCategories(subject, chapter, questionType) {
    localStorage.setItem('lastUsedCategories', JSON.stringify({
      subject,
      chapter,
      questionType
    }));
  }

  async function loadCategories() {
    try {
      const response = await fetch("/api/categories");
      const { subjects, chapters, questionTypes } = await response.json();

      // 填充科目选项
      subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
      });

      // 填充章节选项
      chapters.forEach(chapter => {
        const option = document.createElement("option");
        option.value = chapter;
        option.textContent = chapter;
        chapterSelect.appendChild(option);
      });

      // 填充题型选项
      questionTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        questionTypeSelect.appendChild(option);
      });

      // 当选择框变化时，将值同步到输入框
      subjectSelect.addEventListener("change", (e) => {
        if (e.target.value) subjectInput.value = e.target.value;
      });
      chapterSelect.addEventListener("change", (e) => {
        if (e.target.value) chapterInput.value = e.target.value;
      });
      questionTypeSelect.addEventListener("change", (e) => {
        if (e.target.value) questionTypeInput.value = e.target.value;
      });

      // 当输入框输入时，清空选择框的值
      subjectInput.addEventListener("input", () => subjectSelect.value = "");
      chapterInput.addEventListener("input", () => chapterSelect.value = "");
      questionTypeInput.addEventListener("input", () => questionTypeSelect.value = "");

      // 加载上次使用的分类
      loadLastUsedCategories();
    } catch (error) {
      console.error("加载分类失败:", error);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const question = {
      term: termInput.value.trim(),
      definition: definitionInput.value.trim(),
      subject: subjectInput.value.trim() || subjectSelect.value,
      chapter: chapterInput.value.trim() || chapterSelect.value,
      questionType: questionTypeInput.value.trim() || questionTypeSelect.value
    };

    if (!question.term || !question.definition || !question.subject || 
        !question.chapter || !question.questionType) {
      showMessage("请填写所有必填字段", "error");
      return;
    }

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(question)
      });

      if (response.ok) {
        showMessage("题目添加成功！", "success");
        // 保存当前使用的分类
        saveLastUsedCategories(question.subject, question.chapter, question.questionType);
        // 只重置题目和答案字段，保留分类
        termInput.value = "";
        definitionInput.value = "";
        termInput.focus();
      } else {
        const error = await response.json();
        throw new Error(error.error || "添加题目失败");
      }
    } catch (error) {
      console.error("Error:", error);
      showMessage(error.message || "添加题目失败，请重试", "error");
    }
  });

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = "block";

    setTimeout(() => {
      messageEl.style.display = "none";
    }, 3000);
  }

  loadCategories();
});