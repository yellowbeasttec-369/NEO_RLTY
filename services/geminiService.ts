
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async fetchAIData(prompt: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        },
      });
      return response.text || '';
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  },

  async estimatePropertyValuation(propertyDetails: string): Promise<number> {
    const prompt = `Act as a real estate valuation expert in Dubai. Estimate the current market value in AED for: ${propertyDetails}. Return ONLY the number without commas or currency symbols.`;
    const result = await this.fetchAIData(prompt);
    const cleaned = result.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  },

  async generatePaymentPlan(propertyDetails: string, totalValue: number) {
    const prompt = `Generate a realistic off-plan payment plan for: ${propertyDetails} with a total value of ${totalValue} AED. 
    Return as a JSON array of objects with keys: "milestone" (string), "percent" (number), "date" (YYYY-MM-DD string).
    Ensure percentages sum to 100. Provide 4-6 milestones.`;
    
    const result = await this.fetchAIData(prompt);
    const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  }
};
