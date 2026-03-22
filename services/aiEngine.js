const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function runAgents(suppliers, question) {
  // Agent 1: Cost Analyst
  const costAnalysis = `Analyze cost efficiency of suppliers: ${JSON.stringify(suppliers)}`;

  // Agent 2: Risk Analyst
  const riskAnalysis = `Evaluate risks of suppliers: ${JSON.stringify(suppliers)}`;

  // Agent 3: Strategy Agent
  const strategy = `Given cost + risk, answer: ${question}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "You are a team of procurement AI agents." },
      { role: "user", content: costAnalysis },
      { role: "user", content: riskAnalysis },
      { role: "user", content: strategy },
    ],
  });

  return completion.choices[0].message.content;
}

module.exports = { runAgents };