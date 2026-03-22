function simulateScenario(suppliers, changePercent) {
  return suppliers.map((s) => ({
    ...s,
    newPrice: s.price * (1 + changePercent / 100),
  }));
}

module.exports = { simulateScenario };