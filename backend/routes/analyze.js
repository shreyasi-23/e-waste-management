import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { ewasteData } = req.body;

    // Initialize inside handler to ensure env vars are loaded
    const genAI = new GoogleGenAI({});

    const prompt = `You are an e-waste valuation expert. Analyze the following e-waste data from a landfill and provide a detailed economic analysis.

E-waste data:
- Type: ${ewasteData.type}
- Quantity: ${ewasteData.quantity} units
- Weight: ${ewasteData.weight} kg
- Condition: ${ewasteData.condition}
- Known Parts: ${ewasteData.parts || 'Not specified'}
- Additional Info: ${ewasteData.additionalInfo || 'None'}

You MUST respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "totalEstimatedValue": "$X - $Y",
  "summary": "Brief summary of economic potential",
  "environmentalImpact": "Environmental benefits of proper recycling",
  "opportunities": [
    {
      "category": "Category name",
      "estimatedValue": "$X - $Y",
      "materials": ["material1", "material2"],
      "recyclingPotential": "Description of recycling potential",
      "recommendations": ["recommendation1", "recommendation2"]
    }
  ]
}

Provide at least 2-3 opportunity categories with realistic dollar value estimates based on current market rates.`;

    // Build contents array with images (if provided) and prompt
    const contents = [];
    const images = req.body.images || [];

    images.forEach((image) => {
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: image,
        },
      });
    });
    contents.push({ text: prompt });

    // Call Gemini API to generate analysis
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });
    const text = response.text;

    // Clean up the response - remove markdown code blocks if present
    let cleanedText = text;
    if (text.startsWith('```json')) {
      cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (text.startsWith('```')) {
      cleanedText = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Parse the JSON response from Gemini
    const analysisResult = JSON.parse(cleanedText.trim());

    res.json(analysisResult);
  } catch (error) {
    console.error('Gemini API error:', error.message || error);

    // Check for rate limit errors
    if (error.message && error.message.includes('429')) {
      res.status(429).json({ error: 'API rate limit exceeded. Please wait a moment and try again.' });
    } else {
      res.status(500).json({ error: 'Failed to analyze e-waste data', details: error.message });
    }
  }
});

export default router;
