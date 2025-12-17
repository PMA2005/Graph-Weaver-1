import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNodeSchema, insertEdgeSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/graph", (_req, res) => {
    try {
      const data = storage.getGraphData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      res.status(500).json({ error: "Failed to fetch graph data" });
    }
  });

  app.get("/api/nodes", (_req, res) => {
    try {
      const nodes = storage.getNodes();
      res.json(nodes);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      res.status(500).json({ error: "Failed to fetch nodes" });
    }
  });

  app.get("/api/nodes/:nodeId", (req, res) => {
    try {
      const node = storage.getNodeById(req.params.nodeId);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }
      res.json(node);
    } catch (error) {
      console.error("Error fetching node:", error);
      res.status(500).json({ error: "Failed to fetch node" });
    }
  });

  app.post("/api/nodes", (req, res) => {
    try {
      const parsed = insertNodeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid node data", details: parsed.error });
      }
      const node = storage.createNode(parsed.data);
      res.status(201).json(node);
    } catch (error) {
      console.error("Error creating node:", error);
      res.status(500).json({ error: "Failed to create node" });
    }
  });

  app.patch("/api/nodes/:nodeId", (req, res) => {
    try {
      const node = storage.updateNode(req.params.nodeId, req.body);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }
      res.json(node);
    } catch (error) {
      console.error("Error updating node:", error);
      res.status(500).json({ error: "Failed to update node" });
    }
  });

  app.delete("/api/nodes/:nodeId", (req, res) => {
    try {
      const deleted = storage.deleteNode(req.params.nodeId);
      if (!deleted) {
        return res.status(404).json({ error: "Node not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting node:", error);
      res.status(500).json({ error: "Failed to delete node" });
    }
  });

  app.get("/api/edges", (_req, res) => {
    try {
      const edges = storage.getEdges();
      res.json(edges);
    } catch (error) {
      console.error("Error fetching edges:", error);
      res.status(500).json({ error: "Failed to fetch edges" });
    }
  });

  app.post("/api/edges", (req, res) => {
    try {
      const parsed = insertEdgeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid edge data", details: parsed.error });
      }
      const edge = storage.createEdge(parsed.data);
      res.status(201).json(edge);
    } catch (error) {
      console.error("Error creating edge:", error);
      res.status(500).json({ error: "Failed to create edge" });
    }
  });

  app.delete("/api/edges", (req, res) => {
    try {
      const { source_node, target_node, relationship_type } = req.query;
      if (!source_node || !target_node) {
        return res.status(400).json({ error: "source_node and target_node are required" });
      }
      const deleted = storage.deleteEdge(
        source_node as string, 
        target_node as string,
        relationship_type as string | undefined
      );
      if (!deleted) {
        return res.status(404).json({ error: "Edge not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting edge:", error);
      res.status(500).json({ error: "Failed to delete edge" });
    }
  });

  return httpServer;
}
