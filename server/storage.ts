import Database from 'better-sqlite3';
import path from 'path';
import type { GraphNode, GraphEdge, InsertNode, InsertEdge, GraphData } from '@shared/schema';

const DB_PATH = path.join(process.cwd(), 'attached_assets', 'graph2_1765932308440.db');

export interface IStorage {
  getGraphData(): GraphData;
  getNodes(): GraphNode[];
  getEdges(): GraphEdge[];
  getNodeById(nodeId: string): GraphNode | undefined;
  createNode(node: InsertNode): GraphNode;
  updateNode(nodeId: string, node: Partial<InsertNode>): GraphNode | undefined;
  deleteNode(nodeId: string): boolean;
  createEdge(edge: InsertEdge): GraphEdge;
  deleteEdge(sourceNode: string, targetNode: string): boolean;
}

export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.initializeTables();
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
          PRIMARY KEY (source_node, target_node, relationship_type)
        )
      `);
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
    const deleteEdges = this.db.prepare(
      'DELETE FROM edges WHERE source_node = ? OR target_node = ?'
    );
    deleteEdges.run(nodeId, nodeId);

    const deleteNode = this.db.prepare('DELETE FROM nodes WHERE node_id = ?');
    const result = deleteNode.run(nodeId);
    return result.changes > 0;
  }

  createEdge(edge: InsertEdge): GraphEdge {
    const timestamp = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO edges (source_node, target_node, relationship_type, weight, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(edge.source_node, edge.target_node, edge.relationship_type, edge.weight || 1, timestamp);
    return { ...edge, weight: edge.weight || 1, timestamp };
  }

  deleteEdge(sourceNode: string, targetNode: string): boolean {
    const stmt = this.db.prepare(
      'DELETE FROM edges WHERE source_node = ? AND target_node = ?'
    );
    const result = stmt.run(sourceNode, targetNode);
    return result.changes > 0;
  }
}

export const storage = new SQLiteStorage();
