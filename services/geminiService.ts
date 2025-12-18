
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the API client
// Fix: Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Estimates property value based on metadata
   */
  async estimateValuation(asset: any): Promise<number> {
    const prompt = `
      Act as a Dubai Real Estate Valuation Expert. 
      Estimate the current market price in AED for the following property:
      - Building: ${asset.buildingName}
      - Area: ${asset.area}
      - Type: ${asset.type}
      - Size: ${asset.size} sqft
      - Bedrooms: ${asset.bedrooms}
      
      Return a JSON object with estimatedValue, confidence, and reasoning.
    `;

    try {
      // Fix: Use gemini-3-pro-preview for complex reasoning tasks like property valuation
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // Fix: Added responseSchema for robust JSON handling
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedValue: {
                type: Type.NUMBER,
                description: "The estimated market value of the property in AED"
              },
              confidence: {
                type: Type.NUMBER,
                description: "The confidence level of the valuation (0-1)"
              },
              reasoning: {
                type: Type.STRING,
                description: "Explanation for the valuation"
              }
            },
            required: ["estimatedValue", "confidence", "reasoning"]
          }
        }
      });
      
      // Fix: Use response.text property (not method) to get content
      const data = JSON.parse(response.text || '{}');
      return data.estimatedValue || 0;
    } catch (error) {
      console.error("Valuation Error:", error);
      return 0;
    }
  },

  /**
   * Generates an off-plan payment plan
   */
  async generatePaymentPlan(assetName: string, totalValue: number) {
    const prompt = `
      Generate a realistic 50/50 or 60/40 construction-linked payment plan for an off-plan property named "${assetName}" with a total value of ${totalValue} AED.
      Include 5-7 milestones.
      Return as a JSON array of objects with milestone, percent, and date.
    `;

    try {
      // Fix: Use gemini-3-flash-preview for basic data generation tasks
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // Fix: Added responseSchema for structured array output
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                milestone: { type: Type.STRING },
                percent: { type: Type.NUMBER },
                date: { type: Type.STRING }
              },
              required: ["milestone", "percent", "date"]
            }
          }
        }
      });
      // Fix: Use response.text property
      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error("Payment Plan Error:", error);
      return [];
    }
  }
};
