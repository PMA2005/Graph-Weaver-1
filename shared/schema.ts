import { pgTable, text, real, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const nodes = pgTable("nodes", {
  node_id: text("node_id").primaryKey(),
  node_type: text("node_type").notNull(),
  display_name: text("display_name").notNull(),
  description: text("description").notNull().default(""),
  created_at: text("created_at"),
});

export const edges = pgTable("edges", {
  source_node: text("source_node").notNull(),
  target_node: text("target_node").notNull(),
  relationship_type: text("relationship_type").notNull(),
  weight: real("weight").default(1),
  timestamp: text("timestamp"),
}, (table) => ({
  pk: primaryKey({ columns: [table.source_node, table.target_node, table.relationship_type] }),
}));

export const insertNodeSchema = createInsertSchema(nodes).omit({ created_at: true });
export const insertEdgeSchema = createInsertSchema(edges).omit({ timestamp: true });

export type GraphNode = typeof nodes.$inferSelect;
export type GraphEdge = typeof edges.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type InsertEdge = z.infer<typeof insertEdgeSchema>;

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
