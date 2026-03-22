function classifySpend(description) {
  const categories = {
    IT: ["software", "cloud", "server"],
    Logistics: ["transport", "shipping"],
    Manufacturing: ["raw material", "metal", "plastic"],
  };

  for (let category in categories) {
    for (let keyword of categories[category]) {
      if (description.toLowerCase().includes(keyword)) {
        return category;
      }
    }
  }

  return "Other";
}

module.exports = { classifySpend };