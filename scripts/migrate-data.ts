import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';

const SQLITE_PATH = path.join(process.cwd(), 'attached_assets', 'graph2_1765932308440.db');

async function migrateData() {
  console.log('Starting data migration from SQLite to PostgreSQL...');
  
  const sqliteDb = new Database(SQLITE_PATH);
  const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const sqliteNodes = sqliteDb.prepare('SELECT * FROM nodes').all() as any[];
    console.log(`Found ${sqliteNodes.length} nodes in SQLite`);
    
    const sqliteEdges = sqliteDb.prepare('SELECT * FROM edges').all() as any[];
    console.log(`Found ${sqliteEdges.length} edges in SQLite`);
    
    for (const node of sqliteNodes) {
      await pgPool.query(
        `INSERT INTO nodes (node_id, node_type, display_name, description, created_at) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (node_id) DO NOTHING`,
        [node.node_id, node.node_type, node.display_name, node.description || '', node.created_at]
      );
    }
    console.log(`Migrated ${sqliteNodes.length} nodes to PostgreSQL`);
    
    for (const edge of sqliteEdges) {
      await pgPool.query(
        `INSERT INTO edges (source_node, target_node, relationship_type, weight, timestamp) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (source_node, target_node, relationship_type) DO NOTHING`,
        [edge.source_node, edge.target_node, edge.relationship_type, edge.weight || 1, edge.timestamp]
      );
    }
    console.log(`Migrated ${sqliteEdges.length} edges to PostgreSQL`);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

migrateData().catch(console.error);
