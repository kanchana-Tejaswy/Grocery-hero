import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    // 1. Ensure table exists with an ordering field
    await sql`CREATE TABLE IF NOT EXISTS structured_items (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      emoji TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

    // 2. FETCH ALL (GET)
    if (request.method === 'GET') {
      const { rows } = await sql`SELECT * FROM structured_items ORDER BY created_at DESC;`;
      return response.status(200).json(rows);
    }

    // 3. ADD NEW (POST)
    if (request.method === 'POST') {
      const { id, text, completed, emoji } = request.body;
      await sql`INSERT INTO structured_items (id, text, completed, emoji) VALUES (${id}, ${text}, ${completed}, ${emoji});`;
      return response.status(201).json({ success: true });
    }

    // 4. TOGGLE COMPLETE (PATCH)
    if (request.method === 'PATCH') {
      const { id, completed } = request.body;
      await sql`UPDATE structured_items SET completed = ${completed} WHERE id = ${id};`;
      return response.status(200).json({ success: true });
    }

    // 5. DELETE (DELETE)
    if (request.method === 'DELETE') {
      const { id } = request.query;
      await sql`DELETE FROM structured_items WHERE id = ${id};`;
      return response.status(200).json({ success: true });
    }

    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('DB Error:', error);
    return response.status(500).json({ error: error.message });
  }
}
