import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import type { ExpertLocationResult, LegalNewsArticle } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    if (targetLanguage.toLowerCase() === 'english' || !text) return text;
    try {
        const model = 'gemini-2.5-flash';
        const response = await ai.models.generateContent({
            model,
            contents: `Translate the following text to ${targetLanguage}. Do not add any extra commentary, just provide the raw translation.: "${text}"`,
            config: { temperature: 0 },
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Translation failed for text: "${text}" to ${targetLanguage}`, error);
        return text; // Fallback to original text on error
    }
};


export const getChatbotResponse = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string) => {
  const model = 'gemini-2.5-flash';
  const chat = ai.chats.create({
    model,
    history,
    config: {
      systemInstruction: "You are Satyavāk, an AI legal assistant for India. Your goal is to democratize access to justice. Explain complex legal concepts in simple, easy-to-understand language. When asked, translate legal terms into regional Indian languages. Summarize lengthy laws and judgments. After providing information, suggest concrete next steps a user might take, such as 'File an FIR' or 'Consult a lawyer.' Maintain a helpful, unbiased, and reassuring tone. You must not provide legal advice, but you can provide legal information.",
    }
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response;
};

export const findLegalAid = async (query: string, location: { latitude: number; longitude: number } | null): Promise<ExpertLocationResult[]> => {
  const model = 'gemini-2.5-flash';

  const config: {
    tools: { googleMaps: Record<string, never> }[];
    toolConfig?: { retrievalConfig: { latLng: { latitude: number; longitude: number } } };
  } = {
    tools: [{ googleMaps: {} }],
  };

  if (location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      },
    };
  }
  
  const prompt = `Find verified legal aid centers, NGOs, and courts related to the query: "${query}". For each result, provide the title, distance from the current location, a user rating out of 5, a short one-sentence description, a Google Maps URI, and a contact phone number if available. Format the output as a valid JSON array of objects. Each object must have keys: "title", "distance", "rating", "description", "mapUri", and "contactNumber". The 'mapUri' should be taken from the grounding information. If no results are found, return an empty JSON array []. Output ONLY the JSON array, with no additional text, introductory phrases, or markdown formatting.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: config
  });

  try {
    // Sanitize the response to ensure it's valid JSON.
    const jsonString = response.text.trim().replace(/^```json\n?/, '').replace(/```$/, '');
    const results = JSON.parse(jsonString);
    if (Array.isArray(results)) {
        return results;
    }
    return [];
  } catch(e) {
    console.error("Failed to parse JSON response from AI:", e);
    console.error("Raw response text:", response.text);
    // As a fallback, try to extract info from grounding chunks if JSON parsing fails
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const fallbackResults: ExpertLocationResult[] = groundingChunks
        .filter(chunk => chunk.maps)
        .map(chunk => ({
            title: chunk.maps!.title,
            mapUri: chunk.maps!.uri,
            description: "Details not available. Click link for more info.",
            distance: "N/A",
            rating: 0,
        }));
    if (fallbackResults.length > 0) return fallbackResults;

    throw new Error("Could not retrieve or parse location data.");
  }
};

export const getLegalNews = async (query: string): Promise<LegalNewsArticle[]> => {
  const model = 'gemini-2.5-flash';
  const prompt = `Based on the query: "${query}", find up to 15 recent and trending legal news, landmark case studies, and important affairs in India using Google Search. Return the results as a JSON array of objects. Each object must have the keys: "headline", "summary", "publisher", "date", "detailedBrief", and "keyPoints". The 'date' should be a valid date string. The 'keyPoints' should be an array of strings highlighting the most important takeaways. If no results are found, return an empty JSON array []. Output ONLY the JSON array, with no additional text, introductory phrases, or markdown formatting.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{googleSearch: {}}],
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
          title: chunk.web!.title,
          uri: chunk.web!.uri,
      }));

  try {
    const jsonString = response.text.trim().replace(/^```json\n?/, '').replace(/```$/, '');
    let articles: LegalNewsArticle[] = JSON.parse(jsonString);
    if (Array.isArray(articles)) {
      if (sources.length > 0) {
        articles = articles.map(article => ({ ...article, sources }));
      }
      return articles;
    }
    return [];
  } catch (e) {
    console.error("Failed to parse JSON response from AI for news:", e);
    console.error("Raw response text for news:", response.text);
    throw new Error("Could not retrieve or parse news data.");
  }
};

export const getRelatedNews = async (headline: string): Promise<LegalNewsArticle[]> => {
    const model = 'gemini-2.5-flash';
    const prompt = `Based on the legal news headline: "${headline}", find up to 3 similar or related legal news articles or landmark case studies from India using Google Search. Do not include the original article in the results. Return the results as a JSON array of objects. Each object must have the keys: "headline", "summary", "publisher", "date", "detailedBrief", and "keyPoints". The 'date' should be a valid date string. The 'keyPoints' should be an array of strings. If no related results are found, return an empty JSON array []. Output ONLY the JSON array, with no additional text, introductory phrases, or markdown formatting.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
            title: chunk.web!.title,
            uri: chunk.web!.uri,
        }));

    try {
        const jsonString = response.text.trim().replace(/^```json\n?/, '').replace(/```$/, '');
        let articles: LegalNewsArticle[] = JSON.parse(jsonString);
        if (Array.isArray(articles)) {
             if (sources.length > 0) {
                articles = articles.map(article => ({ ...article, sources }));
            }
            return articles;
        }
        return [];
    } catch (e) {
        console.error("Failed to parse JSON response from AI for related news:", e);
        console.error("Raw response text for related news:", response.text);
        // Return empty array on failure instead of throwing, as it's a non-critical feature.
        return [];
    }
};

export const simulateCourtroom = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string, scenario: string) => {
  const model = 'gemini-2.5-flash';
  const chat = ai.chats.create({
    model,
    history,
    config: {
      systemInstruction: `You are a judge in a simulated Indian courtroom. The user is practicing for a trial. The scenario is a ${scenario}. Ask the user questions a judge would ask. Evaluate their responses based on clarity and relevance. Provide constructive feedback at the end of the simulation. Keep your persona as a judge throughout the interaction. Begin by addressing the user and starting the simulation.`
    }
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response;
};

export const generateDocument = async (docType: string, details: Record<string, string>): Promise<GenerateContentResponse> => {
  const model = 'gemini-2.5-flash';
  const detailsString = Object.entries(details)
      .map(([key, value]) => `* ${key}: ${value}`)
      .join('\n');

  const prompt = `Generate a draft for a "${docType}" based on these details:\n${detailsString}\n\nThe document must be compliant with Indian law, written in professional legal English, and structured with appropriate sections, clauses, and proper formatting for a formal legal document. The output must be in clean, well-structured HTML format, using tags like <h1>, <h2>, <p>, <ul>, <li>, and <strong> where appropriate. Do not include any markdown, backticks, or explanatory text outside of the HTML structure. This is for informational purposes only and does not constitute legal advice.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.2,
    }
  });
  return response;
};

export const getTextToSpeech = async (text: string): Promise<string | null> => {
  const model = 'gemini-2.5-flash-preview-tts';
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: `Say this in a clear, helpful, and calm voice: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // A calm and clear voice
        },
      },
    }
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || null;
};