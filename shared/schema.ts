import { z } from "zod";

export const graphNodeSchema = z.object({
  node_id: z.string(),
  node_type: z.string(),
  display_name: z.string(),
  description: z.string().optional().default(""),
  created_at: z.string().optional(),
});

export const graphEdgeSchema = z.object({
  source_node: z.string(),
  target_node: z.string(),
  relationship_type: z.string(),
  weight: z.number().optional(),
  timestamp: z.string().optional(),
});

export const insertNodeSchema = graphNodeSchema.omit({ created_at: true });
export const insertEdgeSchema = graphEdgeSchema.omit({ timestamp: true });

export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type InsertEdge = z.infer<typeof insertEdgeSchema>;

export const graphDataSchema = z.object({
  nodes: z.array(graphNodeSchema).default([]),
  edges: z.array(graphEdgeSchema).default([]),
});

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
