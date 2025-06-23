document.addEventListener("DOMContentLoaded", () => {
  const questionList = document.getElementById("questionList");
  const subjectFilter = document.getElementById("subjectFilter");
  const chapterFilter = document.getElementById("chapterFilter");
  const typeFilter = document.getElementById("typeFilter");
  const applyFilterBtn = document.getElementById("applyFilter");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  let currentPage = 1;
  let totalPages = 1;
  let currentFilters = {};

  // 初始化加载筛选器和题目
  loadFilters().then(() => loadQuestions(currentPage));

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

  // 加载题目
  async function loadQuestions(page) {
    const params = new URLSearchParams();
    if (currentFilters.subject) params.append("subject", currentFilters.subject);
    if (currentFilters.chapter) params.append("chapter", currentFilters.chapter);
    if (currentFilters.type) params.append("type", currentFilters.type);
    params.append("page", page);

    try {
      const response = await fetch(`/api/questions/paged?${params.toString()}`);
      if (!response.ok) throw new Error("获取题目失败");
      const { questions, total, page: current, totalPages: pages } = await response.json();
      
      currentPage = current;
      totalPages = pages;
      renderQuestions(questions);
      updatePagination();
    } catch (error) {
      console.error("Error:", error);
      questionList.innerHTML = `<div class="error">无法加载题目，请刷新重试</div>`;
    }
  }

  // 渲染题目列表
  function renderQuestions(questions) {
    if (questions.length === 0) {
      questionList.innerHTML = '<div class="no-questions">没有找到符合条件的题目</div>';
      return;
    }

    questionList.innerHTML = questions.map((q, index) => `
      <div class="question-item">
        <div class="question-content">
          <div class="question-term">${(currentPage - 1) * 10 + index + 1}. ${q.term}</div>
          <button class="toggle-answer" data-id="${q.createdAt}">显示答案</button>
        </div>
        <div class="answer-content hidden" id="answer-${q.createdAt}">
          <strong>答案：</strong>
          <div class="answer-text">${q.definition}</div>
          <div class="question-meta">
            <span>科目: ${q.subject}</span>
            <span>章节: ${q.chapter}</span>
            <span>题型: ${q.questionType}</span>
          </div>
        </div>
      </div>
    `).join("");

    // 添加答案切换事件
    document.querySelectorAll('.toggle-answer').forEach(btn => {
      btn.addEventListener('click', () => {
        const answerId = btn.getAttribute('data-id');
        const answerEl = document.getElementById(`answer-${answerId}`);
        answerEl.classList.toggle('hidden');
        btn.textContent = answerEl.classList.contains('hidden') ? '显示答案' : '隐藏答案';
      });
    });
  }

  // 更新分页状态
  function updatePagination() {
    pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
  }

  // 事件监听
  applyFilterBtn.addEventListener("click", () => {
    currentFilters = {
      subject: subjectFilter.value,
      chapter: chapterFilter.value,
      type: typeFilter.value
    };
    loadQuestions(1);
  });

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      loadQuestions(currentPage - 1);
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      loadQuestions(currentPage + 1);
    }
  });
});