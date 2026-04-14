import { Category } from "@/types";

export const PROMPTS = {
    categorize: (title: string) => `
You are a financial categorization AI. Given an expense title, return ONLY one of these exact category strings:
Food, Transport, Entertainment, Shopping, Health, Education, Rent, Utilities, Travel, Other

Expense title: "${title}"
Return only the category name, nothing else.`,

    insights: (data: string) => `
You are a personal finance AI. Analyze this spending data and return exactly 3 short, specific, actionable insights in JSON array format. Each insight max 15 words. Be direct and specific with numbers.

Spending data: ${data}

Return ONLY a JSON array like:
[
  {"text": "insight 1", "type": "warning"},
  {"text": "insight 2", "type": "tip"},
  {"text": "insight 3", "type": "info"}
]`,

    predict: (data: string) => `
You are a financial prediction AI. Given daily spending totals for the current month, predict the end-of-month total.

Data (array of daily totals): ${data}

Return ONLY a JSON object:
{"predicted_total": number, "insight": "brief 10-word explanation"}`,

    personality: (data: string) => `
You are a financial personality analyzer. Given 3 months of spending data by category, determine a financial personality type.

Data: ${data}

Return ONLY a JSON object:
{
  "type": "short personality name (e.g. Impulsive Foodie, Disciplined Saver, Weekend Warrior)",
  "emoji": "one emoji",
  "traits": ["trait 1", "trait 2", "trait 3"],
  "description": "2 sentence description"
}`,

    whatif: (category: Category, percent: number, monthlyData: string) => `
You are a financial savings simulator. Calculate projected savings if a user reduces their ${category} spending by ${percent}%.

Current monthly spending data: ${monthlyData}

Return ONLY a JSON object:
{
  "monthly_savings": number,
  "savings_3_months": number,
  "savings_6_months": number,
  "savings_12_months": number,
  "insight": "specific actionable insight in 15 words"
}`,

    voice: (transcript: string) => `
You are a natural language expense parser. Extract expense details from this voice transcript.

Transcript: "${transcript}"

Return ONLY a JSON object:
{
  "title": "expense title",
  "amount": number,
  "category": "one of: Food, Transport, Entertainment, Shopping, Health, Education, Rent, Utilities, Travel, Other",
  "date": "YYYY-MM-DD (today if not specified)",
  "note": "optional note or empty string"
}`,

    receipt: () => `
You are a receipt OCR AI. Extract the following information from this receipt image.

Return ONLY a JSON object:
{
  "merchant": "merchant/store name",
  "amount": number (total amount paid),
  "date": "YYYY-MM-DD",
  "category": "one of: Food, Transport, Entertainment, Shopping, Health, Education, Rent, Utilities, Travel, Other",
  "items": "brief comma-separated list of main items (optional)"
}`,
};
