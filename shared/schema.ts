import { z } from "zod";

export const graphNodeSchema = z.object({
  node_id: z.string(),
  node_type: z.string(),
  display_name: z.string(),
  description: z.string(),
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

// Partial update schema - only allows updating display_name, description, node_type
// Does NOT allow changing node_id
export const updateNodeSchema = z.object({
  display_name: z.string().optional(),
  description: z.string().optional(),
  node_type: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

// Edge update schema - allows updating relationship_type and weight
export const updateEdgeSchema = z.object({
  new_relationship_type: z.string().min(1, "Relationship type is required"),
  weight: z.number().optional(),
});

export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type InsertEdge = z.infer<typeof insertEdgeSchema>;

export const graphDataSchema = z.object({
  nodes: z.array(graphNodeSchema).default([]),
  edges: z.array(graphEdgeSchema).default([]),
});

export const createSnapshotSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  description: z.string().max(1000, "Description must be 1000 characters or less").optional(),
});

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
