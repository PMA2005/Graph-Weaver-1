import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNodeSchema, insertEdgeSchema, graphDataSchema, updateNodeSchema, createSnapshotSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Health check endpoint for Electron
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  
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
      // Validate update data - only allows display_name, description, node_type
      const parsed = updateNodeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid update data", 
          details: parsed.error.errors 
        });
      }
      
      const node = storage.updateNode(req.params.nodeId, parsed.data);
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

  app.post("/api/import", (req, res) => {
    try {
      const parsed = graphDataSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid import data format", 
          details: parsed.error.errors 
        });
      }
      
      const data = parsed.data;
      if (data.nodes.length === 0 && data.edges.length === 0) {
        return res.status(400).json({ error: "Import data must contain at least one node or edge" });
      }
      
      const result = storage.importGraphData(data);
      res.json({ 
        success: true, 
        message: `Imported ${result.nodesImported} nodes and ${result.edgesImported} relationships`,
        ...result 
      });
    } catch (error) {
      console.error("Error importing data:", error);
      res.status(500).json({ error: "Failed to import data" });
    }
  });

  app.get("/api/snapshots", (_req, res) => {
    try {
      const snapshots = storage.getSnapshots();
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching snapshots:", error);
      res.status(500).json({ error: "Failed to fetch snapshots" });
    }
  });

  app.post("/api/snapshots", (req, res) => {
    try {
      const parsed = createSnapshotSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid snapshot data", 
          details: parsed.error.errors 
        });
      }
      const { name, description } = parsed.data;
      const snapshot = storage.createSnapshot(name, description);
      res.status(201).json(snapshot);
    } catch (error) {
      console.error("Error creating snapshot:", error);
      res.status(500).json({ error: "Failed to create snapshot" });
    }
  });

  app.post("/api/snapshots/:id/restore", (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid snapshot ID" });
      }
      const result = storage.restoreSnapshot(id);
      res.json({ 
        success: true, 
        message: `Restored ${result.nodesRestored} nodes and ${result.edgesRestored} relationships`,
        ...result 
      });
    } catch (error) {
      console.error("Error restoring snapshot:", error);
      const errorMessage = (error as Error).message;
      if (errorMessage === 'Snapshot not found') {
        return res.status(404).json({ error: "Snapshot not found" });
      }
      if (errorMessage === 'Snapshot contains invalid data and cannot be restored') {
        return res.status(422).json({ error: errorMessage });
      }
      res.status(500).json({ error: "Failed to restore snapshot" });
    }
  });

  app.delete("/api/snapshots/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid snapshot ID" });
      }
      const deleted = storage.deleteSnapshot(id);
      if (!deleted) {
        return res.status(404).json({ error: "Snapshot not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting snapshot:", error);
      res.status(500).json({ error: "Failed to delete snapshot" });
    }
  });

  return httpServer;
}
