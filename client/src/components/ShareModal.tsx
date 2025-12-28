import { useState } from 'react';
import { X, Download, FileJson, FileSpreadsheet, Image, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GraphNode, GraphEdge } from '@shared/schema';

interface ShareModalProps {
  onClose: () => void;
  nodes: GraphNode[];
  edges: GraphEdge[];
  svgRef?: React.RefObject<SVGSVGElement>;
}

type ExportFormat = 'json' | 'csv-nodes' | 'csv-edges' | 'csv-all' | 'png';

export default function ShareModal({ onClose, nodes, edges, svgRef }: ShareModalProps) {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [copied, setCopied] = useState(false);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    setExportingFormat('json');
    const data = { nodes, edges };
    const jsonStr = JSON.stringify(data, null, 2);
    downloadFile(jsonStr, `graph-data-${Date.now()}.json`, 'application/json');
    setTimeout(() => setExportingFormat(null), 500);
  };

  const escapeCSVField = (value: string | undefined | null): string => {
    const str = value || '';
    return `"${str.replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
  };

  const exportCSVNodes = () => {
    setExportingFormat('csv-nodes');
    const headers = ['node_id', 'node_type', 'display_name', 'description', 'created_at'];
    const rows = nodes.map(node => [
      escapeCSVField(node.node_id),
      escapeCSVField(node.node_type),
      escapeCSVField(node.display_name),
      escapeCSVField(node.description),
      escapeCSVField(node.created_at),
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(csv, `graph-nodes-${Date.now()}.csv`, 'text/csv');
    setTimeout(() => setExportingFormat(null), 500);
  };

  const exportCSVEdges = () => {
    setExportingFormat('csv-edges');
    const headers = ['source_node', 'target_node', 'relationship_type', 'weight', 'timestamp'];
    const rows = edges.map(edge => [
      escapeCSVField(edge.source_node),
      escapeCSVField(edge.target_node),
      escapeCSVField(edge.relationship_type),
      edge.weight ?? 1,
      escapeCSVField(edge.timestamp),
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(csv, `graph-edges-${Date.now()}.csv`, 'text/csv');
    setTimeout(() => setExportingFormat(null), 500);
  };

  const exportCSVAll = () => {
    setExportingFormat('csv-all');
    exportCSVNodes();
    setTimeout(() => {
      exportCSVEdges();
      setExportingFormat(null);
    }, 100);
  };

  const exportPNG = async () => {
    setExportingFormat('png');
    
    if (!svgRef?.current) {
      console.error('SVG reference not available');
      setExportingFormat(null);
      return;
    }

    try {
      const svg = svgRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = svg.clientWidth * scale;
        canvas.height = svg.clientHeight * scale;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0a0e27';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `graph-visualization-${Date.now()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
            setExportingFormat(null);
          }, 'image/png');
        }
        URL.revokeObjectURL(svgUrl);
      };
      img.onerror = () => {
        console.error('Failed to load SVG for PNG export');
        setExportingFormat(null);
        URL.revokeObjectURL(svgUrl);
      };
      img.src = svgUrl;
    } catch (error) {
      console.error('PNG export error:', error);
      setExportingFormat(null);
    }
  };

  const copyJSONToClipboard = async () => {
    const data = { nodes, edges };
    const jsonStr = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportOptions = [
    {
      id: 'json' as ExportFormat,
      title: 'JSON Data',
      description: 'Complete graph data in JSON format',
      icon: FileJson,
      action: exportJSON,
      color: 'cyan',
    },
    {
      id: 'csv-nodes' as ExportFormat,
      title: 'CSV - Nodes Only',
      description: 'Export all nodes as spreadsheet',
      icon: FileSpreadsheet,
      action: exportCSVNodes,
      color: 'green',
    },
    {
      id: 'csv-edges' as ExportFormat,
      title: 'CSV - Relationships Only',
      description: 'Export all relationships as spreadsheet',
      icon: FileSpreadsheet,
      action: exportCSVEdges,
      color: 'green',
    },
    {
      id: 'png' as ExportFormat,
      title: 'PNG Image',
      description: 'Save graph visualization as image',
      icon: Image,
      action: exportPNG,
      color: 'purple',
      disabled: !svgRef?.current,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
      data-testid="modal-share"
    >
      <div
        className="relative max-w-lg w-full rounded-xl p-4 sm:p-6 border border-cyan-500/30 my-auto"
        style={{
          background: 'rgb(20, 24, 59)',
          boxShadow: '0 0 50px rgba(0, 255, 255, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          data-testid="button-close-share"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="mb-6">
          <h2
            className="font-display text-xl font-bold text-white mb-1"
            style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
          >
            Export Graph Data
          </h2>
          <p className="text-gray-400 text-sm">
            {nodes.length} nodes, {edges.length} relationships
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {exportOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              disabled={option.disabled || exportingFormat !== null}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                option.disabled
                  ? 'opacity-50 cursor-not-allowed border-gray-700'
                  : 'border-gray-700 hover:border-cyan-500/50 hover:bg-cyan-500/5'
              }`}
              style={{ background: 'rgb(15, 19, 49)' }}
              data-testid={`button-export-${option.id}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    option.color === 'cyan'
                      ? 'bg-cyan-500/10 border border-cyan-500/30'
                      : option.color === 'green'
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-purple-500/10 border border-purple-500/30'
                  }`}
                >
                  {exportingFormat === option.id ? (
                    <div className="w-4 h-4 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin" />
                  ) : (
                    <option.icon
                      className={`w-5 h-5 ${
                        option.color === 'cyan'
                          ? 'text-cyan-400'
                          : option.color === 'green'
                          ? 'text-green-400'
                          : 'text-purple-400'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white text-sm">{option.title}</h3>
                  <p className="text-xs text-gray-400">{option.description}</p>
                </div>
                <Download className="w-4 h-4 text-gray-500" />
              </div>
            </button>
          ))}
        </div>

        <div
          className="p-4 rounded-lg border border-gray-700"
          style={{ background: 'rgb(15, 19, 49)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-white text-sm">Copy to Clipboard</h3>
              <p className="text-xs text-gray-400">Copy JSON data to paste elsewhere</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyJSONToClipboard}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              data-testid="button-copy-json"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
