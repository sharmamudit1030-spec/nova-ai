
import "dotenv/config";
import express from "express";
import { ChatGoogle } from "@langchain/google";
import { createAgent } from "langchain";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { evaluate } from "mathjs";

const app = express();

app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

// Tool 1: Calculator
const calculatorTool = tool(
  async ({ expression }) => {
    try {
      if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
        return "Only basic mathematical expressions are allowed.";
      }
      return `Answer: ${evaluate(expression)}`;
    } catch {
      return "Invalid mathematical expression.";
    }
  },
  {
    name: "calculator",
    description: "Use this tool to solve mathematical calculations.",
    schema: z.object({
      expression: z.string()
    })
  }
);

// Tool 2: Study planner
const studyPlannerTool = tool(
  async ({ subject, hours }) => {
    const topics = [
      "Understand the basics",
      "Study important concepts",
      "Practice questions",
      "Revise and take a short test"
    ];

    return `Study plan for ${subject} (${hours} hours):\n` +
      topics.map((topic, i) =>
        `${i + 1}. ${topic} - ${(hours / 4).toFixed(1)} hours`
      ).join("\n");
  },
  {
    name: "study_planner",
    description: "Create a study plan for a subject and number of hours.",
    schema: z.object({
      subject: z.string(),
      hours: z.number().min(1).max(12)
    })
  }
);

// Tool 3: Date and time
const dateTimeTool = tool(
  async () => new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short"
  }),
  {
    name: "current_date_time",
    description: "Get the current date and time."
  }
);

// Gemini model
const model = new ChatGoogle({
    model: "gemini-3.8-flash",
  apiKey: process.env.GOOGLE_API_KEY
});
 // Agent that decides which tool to use
const agent = createAgent({
  model,
  tools: [calculatorTool, studyPlannerTool, dateTimeTool],
  systemPrompt: `You are Nova, a helpful Agentic AI assistant.
Answer clearly and politely.
Use the calculator tool for calculations.
Use the study planner tool when users request a study timetable.
Use the date and time tool when users ask for the current date or time.
You can answer general questions using your AI knowledge.`
});

// Chat API
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const result = await agent.invoke({
      messages: [{ role: "user", content: message }]
    });

    const messages = result.messages || [];
    const lastMessage = messages[messages.length - 1];

    res.json({
      reply: typeof lastMessage?.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage?.content ?? "No response received.")
    });
  } catch (error) {
    console.error("Nova AI error:", error);
    res.status(500).json({
      error: "Nova could not respond. Check your API key and try again."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Nova AI is running at http://localhost:${PORT}`);
});
