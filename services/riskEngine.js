function calculateRisk(supplier) {
  let risk = 0;

  // Low rating = high risk
  if (supplier.rating < 3) risk += 50;

  // High price = moderate risk
  if (supplier.price > 1000) risk += 20;

  // Random factor (simulate external risk)
  risk += Math.random() * 30;

  return Math.round(risk);
}

module.exports = { calculateRisk };