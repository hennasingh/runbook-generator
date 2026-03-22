import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // Only accept DELETE
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.body;

    // Validate input
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        return res.status(400).json({ error: 'Runbook ID is required' });
    }

    try {
        // First check if runbook exists
        const { data: existingRunbook, error: fetchError } = await supabase
            .from('runbooks')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !existingRunbook) {
            return res.status(404).json({ error: 'Runbook not found' });
        }

        // Delete the runbook
        const { error: deleteError } = await supabase
            .from('runbooks')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Supabase delete error:', deleteError);
            return res.status(500).json({ error: deleteError.message });
        }

        return res.status(200).json({ 
            message: 'Runbook deleted successfully',
            id: id
        });

    } catch (error) {
        console.error('Error deleting runbook:', error);
        return res.status(500).json({ 
            error: error.message || 'Failed to delete runbook'
        });
    }
}
