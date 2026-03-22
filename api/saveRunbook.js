import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, summary, affected_components, likely_causes, steps, escalation_criteria } = req.body;

    // Validate input
    if (!title || !summary) {
        return res.status(400).json({ error: 'title and summary are required' });
    }

    try {
        const { data, error } = await supabase
            .from('runbooks')
            .insert([
                {
                    title,
                    summary,
                    affected_components: affected_components || [],
                    likely_causes: likely_causes || [],
                    steps: steps || [],
                    escalation_criteria: escalation_criteria || [],
                }
            ])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ 
            message: 'Runbook saved successfully',
            runbook: data[0]
        });

    } catch (error) {
        console.error('Error saving runbook:', error);
        return res.status(500).json({ 
            error: error.message || 'Failed to save runbook'
        });
    }
}