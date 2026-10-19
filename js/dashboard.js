(() => {
  "use strict";

  const data = window.LIGA_DATA;
  const chartInstances = {};
  let preparingPrint = false;
  const colors = { blue: "#0d6efd", green: "#20c997", orange: "#fd7e14", purple: "#7950f2" };
  const formatNumber = (value) => new Intl.NumberFormat("es-EC").format(value);
  const roundedPercent = (current, previous) => previous ? Math.round(((current - previous) / previous) * 100) : 0;
  const trendText = (value) => `${value >= 0 ? "+" : ""}${value}%`;

  if (!data || !Array.isArray(data.teams) || !Array.isArray(data.rounds) || typeof Chart === "undefined") {
    throw new Error("No se pudieron cargar los datos de la Liga Pro o Chart.js.");
  }

  const teamById = new Map(data.teams.map((team) => [team.id, team]));
  const roundFilter = document.getElementById("round-filter");
  const filterCaption = document.getElementById("filter-caption");
  if (!roundFilter || !filterCaption) throw new Error("No se encontró el control de filtro del dashboard.");

  data.rounds.forEach(({ round }) => {
    const option = document.createElement("option");
    option.value = String(round);
    option.textContent = `Jornada ${round}`;
    roundFilter.append(option);
  });
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "Temporada completa";
  roundFilter.append(allOption);
  roundFilter.value = "all";

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 450 },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#17263e", padding: 11, titleFont: { family: "Inter" }, bodyFont: { family: "Inter" } }
    }
  };

  function renderOrUpdateChart(key, canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) throw new Error(`No se encontró el canvas ${canvasId}.`);
    if (chartInstances[key]) {
      chartInstances[key].data = config.data;
      chartInstances[key].options = config.options;
      chartInstances[key].update();
    } else {
      chartInstances[key] = new Chart(canvas, config);
    }
  }

  function getSeasonStats(maxRound) {
    const selectedRounds = data.rounds.filter(({ round }) => maxRound === "all" || round <= Number(maxRound));
    const standings = new Map(data.teams.map((team) => [team.id, {
      id: team.id, name: team.name, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0
    }]));
    const roundGoals = [];
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let attendance = 0;
    let goals = 0;
    let matches = 0;

    selectedRounds.forEach((round) => {
      let goalsThisRound = 0;
      attendance += round.attendance;
      round.matches.forEach((match) => {
        const home = standings.get(match.home);
        const away = standings.get(match.away);
        if (!home || !away) throw new Error(`Partido con equipo desconocido en jornada ${round.round}.`);
        const totalGoals = match.homeGoals + match.awayGoals;
        goalsThisRound += totalGoals;
        goals += totalGoals;
        matches += 1;
        home.played += 1;
        away.played += 1;
        home.goalsFor += match.homeGoals;
        home.goalsAgainst += match.awayGoals;
        away.goalsFor += match.awayGoals;
        away.goalsAgainst += match.homeGoals;
        if (match.homeGoals > match.awayGoals) {
          home.wins += 1;
          home.points += 3;
          away.losses += 1;
          homeWins += 1;
        } else if (match.homeGoals < match.awayGoals) {
          away.wins += 1;
          away.points += 3;
          home.losses += 1;
          awayWins += 1;
        } else {
          home.draws += 1;
          away.draws += 1;
          home.points += 1;
          away.points += 1;
          draws += 1;
        }
      });
      roundGoals.push({ round: round.round, goals: goalsThisRound });
    });

    const sortedStandings = [...standings.values()].sort((a, b) =>
      b.points - a.points ||
      (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name, "es")
    );
    const teamGoals = [...standings.values()]
      .sort((a, b) => b.goalsFor - a.goalsFor || a.name.localeCompare(b.name, "es"))
      .slice(0, 8);

    return { selectedRounds, sortedStandings, teamGoals, roundGoals, homeWins, awayWins, draws, attendance, goals, matches };
  }

  function updateKpis(stats) {
    const previous = stats.selectedRounds.length > 1
      ? getSeasonStats(String(stats.selectedRounds.length - 1))
      : null;
    const goalChange = previous ? roundedPercent(stats.goals, previous.goals) : 0;
    const attendanceChange = previous ? roundedPercent(stats.attendance, previous.attendance) : 0;
    document.getElementById("total-goals").textContent = formatNumber(stats.goals);
    document.getElementById("average-goals").textContent = stats.matches ? (stats.goals / stats.matches).toFixed(2) : "0.00";
    document.getElementById("leader-team").textContent = stats.sortedStandings[0]?.name ?? "—";
    document.getElementById("leader-points").textContent = `${stats.sortedStandings[0]?.points ?? 0} puntos acumulados`;
    document.getElementById("total-attendance").textContent = formatNumber(stats.attendance);

    const goalsChange = document.getElementById("goals-change");
    goalsChange.textContent = trendText(goalChange);
    goalsChange.classList.toggle("negative", goalChange < 0);
    const attendanceChangeElement = document.getElementById("attendance-change");
    attendanceChangeElement.textContent = trendText(attendanceChange);
    attendanceChangeElement.classList.toggle("negative", attendanceChange < 0);
    const averageChange = document.getElementById("average-change");
    const avgPrevious = previous && previous.matches ? previous.goals / previous.matches : 0;
    const avgCurrent = stats.matches ? stats.goals / stats.matches : 0;
    const avgChange = avgPrevious ? roundedPercent(avgCurrent, avgPrevious) : 0;
    averageChange.textContent = trendText(avgChange);
    averageChange.classList.toggle("negative", avgChange < 0);
  }

  function updateCharts(stats) {
    const rootStyles = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.dataset.theme === "dark" && !preparingPrint;
    const chartText = preparingPrint ? "#526177" : rootStyles.getPropertyValue("--chart-text").trim();
    const chartGrid = preparingPrint ? "#dbe1e8" : rootStyles.getPropertyValue("--chart-grid").trim();
    const tooltipBackground = isDark ? "#09111e" : "#17263e";
    const themedPlugins = {
      ...chartDefaults.plugins,
      tooltip: { ...chartDefaults.plugins.tooltip, backgroundColor: tooltipBackground }
    };
    renderOrUpdateChart("goals", "team-goals-chart", {
      type: "bar",
      data: {
        labels: stats.teamGoals.map((team) => teamById.get(team.id).shortName),
        datasets: [{ label: "Goles", data: stats.teamGoals.map((team) => team.goalsFor), backgroundColor: stats.teamGoals.map((team, index) => index === 0 ? colors.green : "#3d83ed"), borderRadius: 6, maxBarThickness: 35 }]
      },
      options: {
        ...chartDefaults,
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true, grid: { color: chartGrid }, ticks: { color: chartText, precision: 0 }, border: { display: false } },
          y: { grid: { display: false }, ticks: { color: chartText, font: { family: "Inter", size: 11 } }, border: { display: false } }
        },
        plugins: { ...themedPlugins, tooltip: { ...themedPlugins.tooltip, callbacks: { label: (context) => ` ${context.parsed.x} goles` } } }
      }
    });

    renderOrUpdateChart("results", "results-chart", {
      type: "doughnut",
      data: {
        labels: ["Victoria local", "Victoria visitante", "Empate"],
        datasets: [{ data: [stats.homeWins, stats.awayWins, stats.draws], backgroundColor: [colors.blue, colors.green, colors.orange], borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        ...chartDefaults,
        cutout: "69%",
        plugins: { ...themedPlugins, tooltip: { ...themedPlugins.tooltip, callbacks: { label: (context) => ` ${context.label}: ${context.parsed} partidos` } } }
      }
    });

    renderOrUpdateChart("rounds", "round-goals-chart", {
      type: "line",
      data: {
        labels: stats.roundGoals.map(({ round }) => `J${round}`),
        datasets: [{ label: "Goles", data: stats.roundGoals.map(({ goals }) => goals), borderColor: colors.blue, backgroundColor: "#0d6efd18", fill: true, tension: .35, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: colors.blue, borderWidth: 3 }]
      },
      options: {
        ...chartDefaults,
        scales: {
          x: { grid: { display: false }, ticks: { color: chartText }, border: { display: false } },
          y: { beginAtZero: true, grid: { color: chartGrid }, ticks: { color: chartText, precision: 0 }, border: { display: false } }
        },
        plugins: { ...themedPlugins, tooltip: { ...themedPlugins.tooltip, callbacks: { label: (context) => ` ${context.parsed.y} goles` } } }
      }
    });

    const radarTeams = stats.sortedStandings.slice(0, 3);
    renderOrUpdateChart("profile", "team-profile-chart", {
      type: "radar",
      data: {
        labels: ["Posesión", "Tiros", "Corners", "Faltas"],
        datasets: radarTeams.map((row) => {
          const team = teamById.get(row.id);
          return {
            label: team.shortName,
            data: [team.stats.possession, team.stats.shots, team.stats.corners, team.stats.fouls],
            borderColor: team.color,
            backgroundColor: `${team.color}20`,
            pointBackgroundColor: team.color,
            borderWidth: 2,
            pointRadius: 2
          };
        })
      },
      options: {
        ...chartDefaults,
        scales: {
          r: {
            min: 0, max: 100,
            angleLines: { color: chartGrid },
            grid: { color: chartGrid },
            pointLabels: { color: chartText, font: { family: "Inter", size: 10 } },
            ticks: { display: false, stepSize: 25 }
          }
        },
        plugins: { ...themedPlugins, legend: { display: true, position: "bottom", labels: { color: chartText, boxWidth: 9, boxHeight: 9, usePointStyle: true, padding: 14, font: { family: "Inter", size: 10 } } } }
      }
    });
  }

  function updateStandings(rows) {
    const tbody = document.getElementById("standings-body");
    tbody.innerHTML = rows.slice(0, 6).map((team, index) => {
      const difference = team.goalsFor - team.goalsAgainst;
      const rankClass = index < 3 ? `rank-${index + 1}` : "";
      return `<tr class="${index < 3 ? "top-row" : ""}">
        <td><span class="rank ${rankClass}">${index + 1}</span></td>
        <td class="team-name">${team.name}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td>
        <td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${difference > 0 ? "+" : ""}${difference}</td><td class="points-cell">${team.points}</td>
      </tr>`;
    }).join("");
  }

  function renderDashboard() {
    const selected = roundFilter.value;
    const stats = getSeasonStats(selected);
    const selectedRound = selected === "all" ? data.rounds.length : Number(selected);
    const periodLabel = selected === "all" ? "TEMPORADA" : `J1–J${selectedRound}`;
    document.getElementById("goals-period").textContent = periodLabel;
    document.getElementById("results-period").textContent = periodLabel;
    document.getElementById("round-period").textContent = `J1 — J${selectedRound}`;
    filterCaption.textContent = selected === "all"
      ? `Temporada completa · ${stats.matches} partidos`
      : `Jornadas 1–${selectedRound} · ${stats.matches} partidos`;
    updateKpis(stats);
    updateCharts(stats);
    updateStandings(stats.sortedStandings);
  }

  roundFilter.addEventListener("change", renderDashboard);
  window.addEventListener("themechange", renderDashboard);
  document.getElementById("export-pdf").addEventListener("click", () => {
    const selectedRound = roundFilter.value === "all" ? data.rounds.length : Number(roundFilter.value);
    const period = roundFilter.value === "all" ? "temporada completa" : `jornadas 1 a ${selectedRound}`;
    document.getElementById("print-report-date").textContent =
      `Reporte generado el ${new Intl.DateTimeFormat("es-EC", { dateStyle: "long" }).format(new Date())} · Filtro: ${period}.`;
    preparingPrint = true;
    renderDashboard();
    window.addEventListener("afterprint", () => {
      preparingPrint = false;
      renderDashboard();
    }, { once: true });
    window.print();
  });
  renderDashboard();
})();
