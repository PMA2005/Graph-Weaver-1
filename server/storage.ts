import { db } from "./db";
import { nodes, edges } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { GraphNode, GraphEdge, InsertNode, InsertEdge, GraphData } from "@shared/schema";

export interface IStorage {
  getGraphData(): Promise<GraphData>;
  getNodes(): Promise<GraphNode[]>;
  getEdges(): Promise<GraphEdge[]>;
  getNodeById(nodeId: string): Promise<GraphNode | undefined>;
  createNode(node: InsertNode): Promise<GraphNode>;
  updateNode(nodeId: string, node: Partial<InsertNode>): Promise<GraphNode | undefined>;
  deleteNode(nodeId: string): Promise<boolean>;
  createEdge(edge: InsertEdge): Promise<GraphEdge>;
  deleteEdge(sourceNode: string, targetNode: string, relationshipType?: string): Promise<boolean>;
}

export class PostgresStorage implements IStorage {
  async getGraphData(): Promise<GraphData> {
    return {
      nodes: await this.getNodes(),
      edges: await this.getEdges(),
    };
  }

  async getNodes(): Promise<GraphNode[]> {
    return await db.select().from(nodes);
  }

  async getEdges(): Promise<GraphEdge[]> {
    return await db.select().from(edges);
  }

  async getNodeById(nodeId: string): Promise<GraphNode | undefined> {
    const result = await db.select().from(nodes).where(eq(nodes.node_id, nodeId));
    return result[0];
  }

  async createNode(node: InsertNode): Promise<GraphNode> {
    const createdAt = new Date().toISOString();
    const result = await db.insert(nodes).values({
      ...node,
      created_at: createdAt,
    }).returning();
    return result[0];
  }

  async updateNode(nodeId: string, node: Partial<InsertNode>): Promise<GraphNode | undefined> {
    const existing = await this.getNodeById(nodeId);
    if (!existing) return undefined;

    const result = await db.update(nodes)
      .set(node)
      .where(eq(nodes.node_id, nodeId))
      .returning();
    return result[0];
  }

  async deleteNode(nodeId: string): Promise<boolean> {
    await db.delete(edges).where(eq(edges.source_node, nodeId));
    await db.delete(edges).where(eq(edges.target_node, nodeId));
    
    const result = await db.delete(nodes).where(eq(nodes.node_id, nodeId)).returning();
    return result.length > 0;
  }

  async createEdge(edge: InsertEdge): Promise<GraphEdge> {
    const timestamp = new Date().toISOString();
    const result = await db.insert(edges).values({
      ...edge,
      weight: edge.weight || 1,
      timestamp,
    }).returning();
    return result[0];
  }

  async deleteEdge(sourceNode: string, targetNode: string, relationshipType?: string): Promise<boolean> {
    if (relationshipType) {
      const result = await db.delete(edges)
        .where(and(
          eq(edges.source_node, sourceNode),
          eq(edges.target_node, targetNode),
          eq(edges.relationship_type, relationshipType)
        ))
        .returning();
      return result.length > 0;
    } else {
      const result = await db.delete(edges)
        .where(and(
          eq(edges.source_node, sourceNode),
          eq(edges.target_node, targetNode)
        ))
        .returning();
      return result.length > 0;
    }
  }
}

export const storage = new PostgresStorage();
