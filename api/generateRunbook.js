import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { problemDescription } = req.body;

    // Validate input
    if (!problemDescription || typeof problemDescription !== 'string') {
        return res.status(400).json({ error: 'problemDescription is required' });
    }

    try {
        const message = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert support engineer. Generate a structured runbook for the given problem. 
                    Return a JSON object with this structure:
                         {
                            "title": "short issue title",
                            "summary": "one sentence problem summary",
                            "affected_components": ["component 1", "component 2"],
                            "likely_causes": ["cause 1", "cause 2"],
                            "steps": ["Step 1: ...", "Step 2: ..."],
                            "escalation_criteria": ["criterion 1", "criterion 2"]
                            }
                    
                    Return ONLY valid JSON, no markdown formatting.`
                },
                {
                    role: 'user',
                    content: `Problem: ${problemDescription}`
                }
            ],
            temperature: 0.3,
        });

        // Parse the response
        const responseText = message.choices[0].message.content;
        const runbook = JSON.parse(responseText);

        return res.status(200).json(runbook);

    } catch (error) {
        console.error('Error generating runbook:', error);
        return res.status(500).json({ 
            error: error.message || 'Failed to generate runbook'
        });
    }
}