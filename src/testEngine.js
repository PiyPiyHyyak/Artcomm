const TEST_STEPS = [
  {
    id: "profile",
    type: "single",
    title: "Вы из ...",
    options: [
      { text: "корпорации", value: "corporation" },
      { text: "органа власти", value: "government" }
    ]
  },
  {
    id: "problems",
    type: "multi",
    title: "Какие проблемы беспокоят?",
    hint: "Выберите все актуальные для вас ответы",
    options: [
      {
        text: "Сильная команда — слабая управляемость. Решения есть, но теряются на стыках подразделений.",
        value: "management"
      },
      {
        text: "Разрывы во взаимодействии. Информация передаётся медленно и искажается по пути.",
        value: "handoffs"
      },
      {
        text: "Руководителя слушают, но не слышат. Сигнал сверху не превращается в действия на местах.",
        value: "alignment"
      },
      {
        text: "Есть идеи — мало системных проектов. Потенциал сотрудников не превращается в устойчивый результат.",
        value: "projects"
      }
    ]
  }
];

const RECOMMENDATIONS = {
  session: {
    key: "session",
    title: "Управленческая сессия",
    duration: "2–4 часа",
    anchor: "format-session"
  },
  foresight: {
    key: "foresight",
    title: "Проектная форсайт-сессия",
    duration: "1–2 дня",
    anchor: "format-foresight"
  },
  acceleration: {
    key: "acceleration",
    title: "Акселерация",
    duration: "1–12 месяцев",
    anchor: "format-acceleration"
  }
};

function getRecommendation(problemCount) {
  if (problemCount >= 4) {
    return RECOMMENDATIONS.acceleration;
  }

  if (problemCount >= 2) {
    return RECOMMENDATIONS.foresight;
  }

  return RECOMMENDATIONS.session;
}

function createOptionButton({ text, selected, onClick }) {
  const optionButton = document.createElement("button");
  optionButton.type = "button";
  optionButton.className = `test-option${selected ? " is-selected" : ""}`;
  optionButton.setAttribute("aria-pressed", selected ? "true" : "false");

  const indicator = document.createElement("span");
  indicator.className = "test-option-indicator";
  indicator.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "test-option-label";
  label.textContent = text;

  optionButton.appendChild(indicator);
  optionButton.appendChild(label);
  optionButton.addEventListener("click", onClick);
  return optionButton;
}

export function mountProblemTest({
  questionWrap,
  stepMeta,
  progressBar,
  nextButton,
  backButton,
  resultNode,
  onShowFormat,
  showInlineResult = true
}) {
  if (!questionWrap || !progressBar || !nextButton || !backButton || !resultNode) {
    return null;
  }

  const stageRoot = questionWrap.closest(".test-stage");
  const shellRoot = questionWrap.closest(".test-shell");

  const state = {
    index: 0,
    view: "question",
    answers: {
      profile: "",
      problems: []
    }
  };

  function isCurrentStepValid() {
    const currentStep = TEST_STEPS[state.index];
    if (!currentStep) {
      return false;
    }

    if (currentStep.id === "profile") {
      return Boolean(state.answers.profile);
    }

    return state.answers.problems.length > 0;
  }

  function syncStepUi() {
    const progress = ((state.index + 1) / TEST_STEPS.length) * 100;
    progressBar.style.width = `${progress}%`;
    if (stepMeta) {
      stepMeta.textContent = `Шаг ${state.index + 1} из ${TEST_STEPS.length}`;
    }
    backButton.disabled = state.index === 0;
    nextButton.disabled = !isCurrentStepValid();
    nextButton.textContent = state.index === TEST_STEPS.length - 1 ? "Показать форматы" : "Далее";
    backButton.hidden = false;
    nextButton.hidden = false;
  }

  function renderQuestion() {
    const step = TEST_STEPS[state.index];
    if (!step) {
      return;
    }

    questionWrap.hidden = false;
    resultNode.hidden = true;
    resultNode.innerHTML = "";
    questionWrap.innerHTML = "";
    state.view = "question";
    stageRoot?.classList.remove("is-result-view");
    shellRoot?.classList.remove("is-result-view");
    stageRoot?.setAttribute("data-test-step", step.id);
    stageRoot?.setAttribute("data-test-kind", step.type);

    const title = document.createElement("p");
    title.className = "test-question";
    title.textContent = step.title;

    const hint = step.hint ? document.createElement("p") : null;
    if (hint) {
      hint.className = "test-question-hint";
      hint.textContent = step.hint;
    }

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "test-options";

    step.options.forEach((option) => {
      const isSelected =
        step.type === "single"
          ? state.answers.profile === option.value
          : state.answers.problems.includes(option.value);

      const button = createOptionButton({
        text: option.text,
        selected: isSelected,
        onClick: () => {
          if (step.type === "single") {
            state.answers.profile = option.value;
          } else if (isSelected) {
            state.answers.problems = state.answers.problems.filter((item) => item !== option.value);
          } else {
            state.answers.problems = [...state.answers.problems, option.value];
          }
          renderQuestion();
        }
      });

      optionsWrap.appendChild(button);
    });

    questionWrap.appendChild(title);
    if (hint) {
      questionWrap.appendChild(hint);
    }
    questionWrap.appendChild(optionsWrap);
    syncStepUi();
  }

  function reset() {
    state.index = 0;
    state.answers = {
      profile: "",
      problems: []
    };
    renderQuestion();
  }

  function renderResult() {
    const recommendation = getRecommendation(state.answers.problems.length);

    questionWrap.hidden = true;
    resultNode.hidden = false;
    resultNode.innerHTML = "";
    state.view = "result";
    stageRoot?.classList.add("is-result-view");
    shellRoot?.classList.add("is-result-view");
    stageRoot?.setAttribute("data-test-step", "result");
    stageRoot?.setAttribute("data-test-kind", "result");
    progressBar.style.width = "100%";
    if (stepMeta) {
      stepMeta.textContent = "Тест завершён";
    }

    const kicker = document.createElement("p");
    kicker.className = "test-result-kicker";
    kicker.textContent = "Тест завершён";

    const title = document.createElement("h3");
    title.textContent = "Форматы, которые подойдут вашей команде";

    const resultLead = document.createElement("p");
    resultLead.className = "test-result-meta";
    resultLead.textContent = "Мы уже отметили наиболее подходящий вариант в подборке.";

    const summary = document.createElement("p");
    summary.className = "test-result-note";
    summary.textContent = "Откройте форматы, чтобы спокойно сравнить все варианты, или пройдите тест заново, если хотите изменить ответы.";

    const actions = document.createElement("div");
    actions.className = "test-result-actions";

    const formatButton = document.createElement("button");
    formatButton.type = "button";
    formatButton.className = "btn btn-primary";
    formatButton.textContent = "Посмотреть форматы";
    formatButton.addEventListener("click", () => {
      if (typeof onShowFormat === "function") {
        onShowFormat({
          profile: state.answers.profile,
          problems: [...state.answers.problems],
          recommendation
        });
      }
    });

    const restartButton = document.createElement("button");
    restartButton.type = "button";
    restartButton.className = "btn btn-secondary";
    restartButton.textContent = "Пройти тест заново";
    restartButton.addEventListener("click", reset);

    actions.appendChild(formatButton);
    actions.appendChild(restartButton);

    resultNode.className = "test-result";
    resultNode.appendChild(kicker);
    resultNode.appendChild(title);
    resultNode.appendChild(resultLead);
    resultNode.appendChild(summary);
    resultNode.appendChild(actions);

    backButton.hidden = true;
    nextButton.hidden = true;
  }

  function restoreCurrentView() {
    if (state.view === "result" && showInlineResult) {
      renderResult();
      return;
    }

    renderQuestion();
  }

  function stabilizeStageHeight() {
    if (!stageRoot) {
      return;
    }

    if (!window.matchMedia("(min-width: 901px)").matches) {
      stageRoot.style.removeProperty("min-height");
      restoreCurrentView();
      return;
    }

    const snapshot = {
      index: state.index,
      view: state.view,
      answers: {
        profile: state.answers.profile,
        problems: [...state.answers.problems]
      }
    };

    const measurementStates = [
      {
        index: 0,
        view: "question",
        answers: {
          profile: "",
          problems: []
        }
      },
      {
        index: 1,
        view: "question",
        answers: {
          profile: "corporation",
          problems: ["management", "handoffs", "alignment", "projects"]
        }
      }
    ];

    if (showInlineResult) {
      measurementStates.push({
        index: 1,
        view: "result",
        answers: {
          profile: "corporation",
          problems: ["management", "handoffs", "alignment", "projects"]
        }
      });
    }

    stageRoot.style.removeProperty("min-height");

    let maxHeight = 0;

    measurementStates.forEach((entry) => {
      state.index = entry.index;
      state.view = entry.view;
      state.answers = {
        profile: entry.answers.profile,
        problems: [...entry.answers.problems]
      };

      if (entry.view === "result") {
        renderResult();
      } else {
        renderQuestion();
      }

      maxHeight = Math.max(maxHeight, Math.ceil(stageRoot.getBoundingClientRect().height));
    });

    state.index = snapshot.index;
    state.view = snapshot.view;
    state.answers = {
      profile: snapshot.answers.profile,
      problems: [...snapshot.answers.problems]
    };

    stageRoot.style.minHeight = `${maxHeight}px`;
    restoreCurrentView();
  }

  backButton.addEventListener("click", () => {
    if (state.index === 0) {
      return;
    }

    state.index -= 1;
    renderQuestion();
  });

  nextButton.addEventListener("click", () => {
    if (!isCurrentStepValid()) {
      return;
    }

    if (state.index === TEST_STEPS.length - 1) {
      if (!showInlineResult) {
        if (typeof onShowFormat === "function") {
          onShowFormat({
            profile: state.answers.profile,
            problems: [...state.answers.problems],
            recommendation: getRecommendation(state.answers.problems.length)
          });
        }
        return;
      }
      renderResult();
      if (typeof onShowFormat === "function") {
        onShowFormat({
          profile: state.answers.profile,
          problems: [...state.answers.problems],
          recommendation: getRecommendation(state.answers.problems.length)
        });
      }
      return;
    }

    state.index += 1;
    renderQuestion();
  });

  reset();
  stabilizeStageHeight();
  window.addEventListener("resize", stabilizeStageHeight);

  return { reset };
}
