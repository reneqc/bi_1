(() => {
  "use strict";

  const questions = [
    {
      question: "¿Cuál es el objetivo principal de Business Intelligence?",
      options: ["Almacenar todos los datos sin procesarlos", "Convertir datos en información útil para decidir", "Reemplazar todos los puestos de trabajo", "Eliminar la necesidad de definir objetivos"],
      correctIndex: 1,
      explanation: "¡Exacto! BI organiza y analiza datos para respaldar decisiones con evidencia."
    },
    {
      question: "¿Qué tipo de decisión define el rumbo de una organización a largo plazo?",
      options: ["Operativa", "Táctica", "Estratégica", "Automática"],
      correctIndex: 2,
      explanation: "Correcto. Las decisiones estratégicas establecen la dirección y los objetivos de largo plazo."
    },
    {
      question: "En el proceso ETL, ¿qué significa la E?",
      options: ["Evaluar", "Extraer datos desde sus fuentes", "Estandarizar indicadores", "Exportar el dashboard"],
      correctIndex: 1,
      explanation: "¡Bien! Extract obtiene datos desde fuentes como archivos, sistemas o APIs."
    },
    {
      question: "¿Cuál es una actividad propia de la fase Transform?",
      options: ["Descargar los datos de ventas", "Publicar el reporte a los usuarios", "Limpiar valores nulos y unificar formatos", "Crear una cuenta de usuario"],
      correctIndex: 2,
      explanation: "Así es: transformar incluye limpiar y estandarizar los datos antes de cargarlos."
    },
    {
      question: "¿Qué sucede en la fase Load (carga) de ETL?",
      options: ["Se identifican las fuentes de datos", "Se almacenan los datos preparados en un destino analítico", "Se eliminan todos los registros antiguos", "Se elige el diseño de los gráficos"],
      correctIndex: 1,
      explanation: "Correcto. Load lleva los datos transformados a un destino, por ejemplo un data warehouse."
    },
    {
      question: "¿Para qué sirve principalmente un KPI?",
      options: ["Para medir el avance hacia un objetivo", "Para sustituir los datos de origen", "Para diseñar una base de datos", "Para garantizar que una predicción sea exacta"],
      correctIndex: 0,
      explanation: "¡Exacto! Un KPI es un indicador clave que ayuda a medir el progreso hacia una meta."
    },
    {
      question: "Un comercio analiza ventas e inventario para anticipar qué productos reponer. ¿Qué beneficio de BI aplica?",
      options: ["Evitar toda variación de la demanda", "Detectar tendencias y actuar oportunamente", "Eliminar la necesidad de registrar ventas", "Convertir decisiones tácticas en estratégicas"],
      correctIndex: 1,
      explanation: "Muy bien. Analizar tendencias permite anticipar la demanda y reducir quiebres de stock."
    },
    {
      question: "¿Cuál es una buena práctica antes de comparar datos entre dos sucursales?",
      options: ["Combinar los archivos aunque usen monedas distintas", "Usar solo el dato más reciente", "Validar y estandarizar formatos y unidades", "Eliminar las filas con cifras pequeñas"],
      correctIndex: 2,
      explanation: "¡Correcto! Estandarizar unidades y formatos permite hacer comparaciones válidas."
    }
  ];

  const quizContent = document.getElementById("quiz-content");
  const scoreElement = document.getElementById("quiz-score");
  const progressBar = document.getElementById("quiz-progress-bar");
  const progress = document.querySelector(".quiz-progress");
  if (!quizContent || !scoreElement || !progressBar || !progress) return;

  const BEST_SCORE_KEY = "biLabBestQuizScore";
  let currentQuestion = 0;
  let score = 0;
  let answered = false;
  let bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;

  function updateProgress() {
    const percentage = Math.round((currentQuestion / questions.length) * 100);
    progressBar.style.width = `${percentage}%`;
    progress.setAttribute("aria-valuenow", String(percentage));
  }

  function renderQuestion() {
    answered = false;
    const item = questions[currentQuestion];
    updateProgress();
    scoreElement.textContent = `${score} puntos`;
    quizContent.innerHTML = `
      <div class="quiz-question">
        <div class="question-count">Pregunta ${currentQuestion + 1} de ${questions.length}</div>
        <h3>${item.question}</h3>
        <div class="quiz-options">
          ${item.options.map((option, index) => `
            <button class="quiz-option" type="button" data-option="${index}">
              <span class="option-letter">${String.fromCharCode(65 + index)}</span>${option}
            </button>`).join("")}
        </div>
        <div id="quiz-feedback-slot"></div>
      </div>`;

    quizContent.querySelectorAll(".quiz-option").forEach((button) => {
      button.addEventListener("click", () => selectAnswer(Number(button.dataset.option)));
    });
  }

  function selectAnswer(selectedIndex) {
    if (answered) return;
    answered = true;
    const item = questions[currentQuestion];
    const isCorrect = selectedIndex === item.correctIndex;
    if (isCorrect) score += 10;

    quizContent.querySelectorAll(".quiz-option").forEach((button, index) => {
      button.disabled = true;
      if (index === item.correctIndex) button.classList.add("is-correct");
      else if (index === selectedIndex) button.classList.add("is-incorrect");
    });

    const feedbackSlot = document.getElementById("quiz-feedback-slot");
    const feedback = document.createElement("div");
    feedback.className = `quiz-feedback${isCorrect ? "" : " is-wrong"}`;
    feedback.innerHTML = `<strong>${isCorrect ? "¡Correcto!" : "Sigue adelante."}</strong> ${item.explanation}`;
    feedbackSlot.append(feedback);
    scoreElement.textContent = `${score} puntos`;

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "btn btn-primary quiz-next";
    nextButton.textContent = currentQuestion === questions.length - 1 ? "Ver resultados" : "Siguiente pregunta →";
    nextButton.addEventListener("click", () => {
      currentQuestion += 1;
      if (currentQuestion === questions.length) renderResults();
      else renderQuestion();
    });
    feedbackSlot.append(nextButton);
  }

  function renderResults() {
    updateProgress();
    const percentage = Math.round((score / (questions.length * 10)) * 100);
    const message = percentage >= 80
      ? "Excelente: tienes una base sólida de BI."
      : percentage >= 50
        ? "Bueno: vas por buen camino, sigue practicando."
        : "Refuerza conceptos: repasa las secciones y vuelve a intentarlo.";

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
    }
    scoreElement.textContent = `${score} puntos`;
    quizContent.innerHTML = `
      <div class="quiz-result">
        <div class="result-badge" aria-hidden="true">${percentage >= 80 ? "🏆" : percentage >= 50 ? "✨" : "📘"}</div>
        <div class="question-count">RETO COMPLETADO</div>
        <h3>${percentage >= 80 ? "¡Excelente trabajo!" : percentage >= 50 ? "¡Buen trabajo!" : "¡Cada intento suma!"}</h3>
        <div class="result-score">${score}<span class="fs-5 text-secondary"> / ${questions.length * 10} puntos</span></div>
        <p class="mb-1">${percentage}% de respuestas correctas</p>
        <p class="text-secondary">${message}</p>
        <p class="best-score">Tu mejor puntaje: <strong>${bestScore} puntos</strong></p>
        <button id="retry-quiz" type="button" class="btn btn-primary mt-3">Reintentar</button>
      </div>`;
    document.getElementById("retry-quiz").addEventListener("click", restartQuiz);
  }

  function restartQuiz() {
    currentQuestion = 0;
    score = 0;
    renderQuestion();
  }

  renderQuestion();
})();
