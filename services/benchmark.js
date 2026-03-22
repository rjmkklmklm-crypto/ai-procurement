function benchmarkPrices(suppliers) {
  const avg =
    suppliers.reduce((sum, s) => sum + s.price, 0) / suppliers.length;

  return suppliers.map((s) => ({
    ...s,
    difference: s.price - avg,
    status: s.price < avg ? "Below Market" : "Above Market",
  }));
}

module.exports = { benchmarkPrices };