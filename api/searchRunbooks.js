import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // Only accept GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { q, page = 1, limit = 10 } = req.query;

    // Validate search query
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const searchTerm = q.trim();
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Validate page and limit
    if (pageNum < 1 || limitNum < 1) {
        return res.status(400).json({ error: 'Page and limit must be positive integers' });
    }

    try {
        // Calculate offset
        const offset = (pageNum - 1) * limitNum;

        // Get total count for search results
        const { count, error: countError } = await supabase
            .from('runbooks')
            .select('*', { count: 'exact', head: true })
            .ilike('title', `%${searchTerm}%`);

        if (countError) {
            console.error('Count error:', countError);
            return res.status(500).json({ error: countError.message });
        }

        // Get paginated search results
        const { data, error } = await supabase
            .from('runbooks')
            .select('*')
            .ilike('title', `%${searchTerm}%`)
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (error) {
            console.error('Query error:', error);
            return res.status(500).json({ error: error.message });
        }

        const total = count || 0;
        const hasNext = offset + limitNum < total;
        const hasPrev = pageNum > 1;

        return res.status(200).json({
            runbooks: data || [],
            page: pageNum,
            limit: limitNum,
            total,
            hasNext,
            hasPrev,
            query: searchTerm
        });

    } catch (error) {
        console.error('Error searching runbooks:', error);
        return res.status(500).json({ 
            error: error.message || 'Failed to search runbooks'
        });
    }
}
