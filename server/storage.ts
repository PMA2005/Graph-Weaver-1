import Database from 'better-sqlite3';
import path from 'path';
import type { GraphNode, GraphEdge, InsertNode, InsertEdge, GraphData } from '@shared/schema';

// Use GRAPH_DB_PATH env var if set (Electron production), otherwise fallback to dev path
const DB_PATH = process.env.GRAPH_DB_PATH || path.join(process.cwd(), 'attached_assets', 'graph2_1765932308440.db');

export interface IStorage {
  getGraphData(): GraphData;
  getNodes(): GraphNode[];
  getEdges(): GraphEdge[];
  getNodeById(nodeId: string): GraphNode | undefined;
  createNode(node: InsertNode): GraphNode;
  updateNode(nodeId: string, node: Partial<InsertNode>): GraphNode | undefined;
  deleteNode(nodeId: string): boolean;
  createEdge(edge: InsertEdge): GraphEdge;
  deleteEdge(sourceNode: string, targetNode: string, relationshipType?: string): boolean;
  importGraphData(data: GraphData): { nodesImported: number; edgesImported: number };
}

export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    // Enable foreign key enforcement in SQLite
    this.db.pragma('foreign_keys = ON');
    this.initializeTables();
    this.migrateEdgesTable();
  }

  private initializeTables() {
    const nodesTableExists = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='nodes'"
    ).get();
    
    if (!nodesTableExists) {
      this.db.exec(`
        CREATE TABLE nodes (
          node_id TEXT PRIMARY KEY,
          node_type TEXT NOT NULL,
          display_name TEXT NOT NULL,
          description TEXT,
          created_at TEXT
        )
      `);
    }

    const edgesTableExists = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='edges'"
    ).get();
    
    if (!edgesTableExists) {
      this.db.exec(`
        CREATE TABLE edges (
          source_node TEXT NOT NULL,
          target_node TEXT NOT NULL,
          relationship_type TEXT NOT NULL,
          weight REAL,
          timestamp TEXT,
          PRIMARY KEY (source_node, target_node, relationship_type),
          FOREIGN KEY (source_node) REFERENCES nodes(node_id) ON DELETE CASCADE,
          FOREIGN KEY (target_node) REFERENCES nodes(node_id) ON DELETE CASCADE
        )
      `);
    }
  }

  private migrateEdgesTable() {
    // Check if edges table already has foreign key constraints
    const tableInfo = this.db.prepare("PRAGMA foreign_key_list(edges)").all();
    
    if (tableInfo.length === 0) {
      // Need to migrate: recreate edges table with foreign key constraints
      console.log('[storage] Migrating edges table to add foreign key constraints with CASCADE delete...');
      
      const transaction = this.db.transaction(() => {
        // 1. Create new table with proper constraints
        this.db.exec(`
          CREATE TABLE edges_new (
            source_node TEXT NOT NULL,
            target_node TEXT NOT NULL,
            relationship_type TEXT NOT NULL,
            weight REAL,
            timestamp TEXT,
            PRIMARY KEY (source_node, target_node, relationship_type),
            FOREIGN KEY (source_node) REFERENCES nodes(node_id) ON DELETE CASCADE,
            FOREIGN KEY (target_node) REFERENCES nodes(node_id) ON DELETE CASCADE
          )
        `);
        
        // 2. Copy valid data (only edges where both nodes exist)
        this.db.exec(`
          INSERT INTO edges_new (source_node, target_node, relationship_type, weight, timestamp)
          SELECT e.source_node, e.target_node, e.relationship_type, e.weight, e.timestamp
          FROM edges e
          WHERE EXISTS (SELECT 1 FROM nodes n WHERE n.node_id = e.source_node)
            AND EXISTS (SELECT 1 FROM nodes n WHERE n.node_id = e.target_node)
        `);
        
        // 3. Drop old table and rename new one
        this.db.exec('DROP TABLE edges');
        this.db.exec('ALTER TABLE edges_new RENAME TO edges');
      });
      
      transaction();
      console.log('[storage] Migration complete: edges table now has CASCADE delete constraints');
    }
  }

  getGraphData(): GraphData {
    return {
      nodes: this.getNodes(),
      edges: this.getEdges(),
    };
  }

  getNodes(): GraphNode[] {
    const stmt = this.db.prepare('SELECT * FROM nodes');
    return stmt.all() as GraphNode[];
  }

  getEdges(): GraphEdge[] {
    const stmt = this.db.prepare('SELECT * FROM edges');
    return stmt.all() as GraphEdge[];
  }

  getNodeById(nodeId: string): GraphNode | undefined {
    const stmt = this.db.prepare('SELECT * FROM nodes WHERE node_id = ?');
    return stmt.get(nodeId) as GraphNode | undefined;
  }

  createNode(node: InsertNode): GraphNode {
    const createdAt = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO nodes (node_id, node_type, display_name, description, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(node.node_id, node.node_type, node.display_name, node.description, createdAt);
    return { ...node, created_at: createdAt };
  }

  updateNode(nodeId: string, node: Partial<InsertNode>): GraphNode | undefined {
    const existing = this.getNodeById(nodeId);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: (string | undefined)[] = [];

    if (node.display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(node.display_name);
    }
    if (node.description !== undefined) {
      updates.push('description = ?');
      values.push(node.description);
    }
    if (node.node_type !== undefined) {
      updates.push('node_type = ?');
      values.push(node.node_type);
    }

    if (updates.length > 0) {
      values.push(nodeId);
      const stmt = this.db.prepare(`UPDATE nodes SET ${updates.join(', ')} WHERE node_id = ?`);
      stmt.run(...values);
    }

    return this.getNodeById(nodeId);
  }

  deleteNode(nodeId: string): boolean {
    // Foreign key CASCADE delete automatically removes related edges
    const deleteNode = this.db.prepare('DELETE FROM nodes WHERE node_id = ?');
    const result = deleteNode.run(nodeId);
    return result.changes > 0;
  }

  createEdge(edge: InsertEdge): GraphEdge {
    const timestamp = new Date().toISOString();
    
    // Delete ALL existing edges between these two nodes (both directions) to prevent duplicates
    // This ensures only one connection exists between any two nodes
    this.db.prepare(`
      DELETE FROM edges 
      WHERE (source_node = ? AND target_node = ?) 
         OR (source_node = ? AND target_node = ?)
    `).run(edge.source_node, edge.target_node, edge.target_node, edge.source_node);
    
    // Insert the new edge with the user's specified direction
    const stmt = this.db.prepare(`
      INSERT INTO edges (source_node, target_node, relationship_type, weight, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(edge.source_node, edge.target_node, edge.relationship_type, edge.weight || 1, timestamp);
    return { ...edge, weight: edge.weight || 1, timestamp };
  }

  deleteEdge(sourceNode: string, targetNode: string, relationshipType?: string): boolean {
    if (relationshipType) {
      const stmt = this.db.prepare(
        'DELETE FROM edges WHERE source_node = ? AND target_node = ? AND relationship_type = ?'
      );
      const result = stmt.run(sourceNode, targetNode, relationshipType);
      return result.changes > 0;
    } else {
      const stmt = this.db.prepare(
        'DELETE FROM edges WHERE source_node = ? AND target_node = ?'
      );
      const result = stmt.run(sourceNode, targetNode);
      return result.changes > 0;
    }
  }

  importGraphData(data: GraphData): { nodesImported: number; edgesImported: number } {
    const transaction = this.db.transaction(() => {
      this.db.exec('DELETE FROM edges');
      this.db.exec('DELETE FROM nodes');

      const insertNode = this.db.prepare(`
        INSERT INTO nodes (node_id, node_type, display_name, description, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertEdge = this.db.prepare(`
        INSERT INTO edges (source_node, target_node, relationship_type, weight, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);

      let nodesImported = 0;
      let edgesImported = 0;

      for (const node of data.nodes || []) {
        insertNode.run(
          node.node_id,
          node.node_type,
          node.display_name,
          node.description || '',
          node.created_at || new Date().toISOString()
        );
        nodesImported++;
      }

      for (const edge of data.edges || []) {
        insertEdge.run(
          edge.source_node,
          edge.target_node,
          edge.relationship_type,
          edge.weight || 1,
          edge.timestamp || new Date().toISOString()
        );
        edgesImported++;
      }

      return { nodesImported, edgesImported };
    });

    return transaction();
  }
}

export const storage = new SQLiteStorage();
