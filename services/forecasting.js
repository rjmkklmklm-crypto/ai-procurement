function forecastDemand(history) {
  // simple average growth model
  let growth = 0;

  for (let i = 1; i < history.length; i++) {
    growth += history[i] - history[i - 1];
  }

  growth = growth / (history.length - 1);

  const next = history[history.length - 1] + growth;

  return Math.round(next);
}

module.exports = { forecastDemand };