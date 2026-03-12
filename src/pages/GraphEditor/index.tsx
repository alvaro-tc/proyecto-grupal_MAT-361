import { useState, useRef, useEffect } from "react";
import { Switch, Modal, Input, message, Button, Col, Row, InputNumber, List } from "antd";
import { SettingOutlined, DeleteOutlined, EditOutlined, InfoCircleOutlined, CloseOutlined, ControlOutlined, SaveOutlined, FolderOpenOutlined, TableOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { GraphContainer, Canvas, Node, EdgeLabel, ContextMenuContainer, ContextMenuItem, StyledModalContent, Sidebar, CanvasContainer, FloatingPanel, PanelToggle } from "./styles";
import { useTranslation } from "react-i18next";
import { useAuth, API_URL } from "../../context/AuthContext";
import AdjacencyMatrix from "../../components/AdjacencyMatrix";

interface GraphNode {
    id: string;
    x: number;
    y: number;
    label: string;
    color: string;
}

interface GraphEdge {
    id: string;
    source: string;
    target: string;
    weight: string;
    isDirected: boolean;
    cpOffset: { dx: number; dy: number }; // bezier control point offset from midpoint
}

const COLORS = ["#2e186a", "#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#eb2f96", "#13c2c2"];

const ModalTitle = ({ title }: { title: string }) => (
    <div style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 600, color: '#2e186a', margin: 0 }}>
        {title}
    </div>
);

const GraphEditor = ({ withMatrix = false }: { withMatrix?: boolean }) => {
    const { t } = useTranslation();
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);

    // Modes
    const [mode, setMode] = useState<'creation' | 'editing'>('creation');
    const [isDirected, setIsDirected] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [showInstructions, setShowInstructions] = useState(true);
    const [showPanel, setShowPanel] = useState(true);
    const [labelMode, setLabelMode] = useState<'letters' | 'numbers'>('letters');
    const [showMatrix, setShowMatrix] = useState(true);
    const [editableMatrix, setEditableMatrix] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to hide header and maximize workspace space
        if (containerRef.current) {
            // Slight delay ensures the DOM is fully rendered before scrolling
            setTimeout(() => {
                containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, []);

    // Auth
    const { user, token } = useAuth();

    // Canvas save/load
    const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
    const [isLoadModalVisible, setIsLoadModalVisible] = useState(false);
    const [canvasName, setCanvasName] = useState('');
    const [canvasList, setCanvasList] = useState<{ id: string; name: string; created_at: string }[]>([]);
    const [savingCanvas, setSavingCanvas] = useState(false);
    const [loadingCanvases, setLoadingCanvases] = useState(false);

    // JSON Export name modal
    const [isExportModalVisible, setIsExportModalVisible] = useState(false);
    const [exportFileName, setExportFileName] = useState('grafo');

    // Interaction State
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [draggingEdge, setDraggingEdge] = useState<string | null>(null);

    // Modals & Inputs
    const [isEdgeModalVisible, setIsEdgeModalVisible] = useState(false);
    const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
    const [edgeWeight, setEdgeWeight] = useState<number | null>(null);
    const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);

    // Context Menu & Edit Modal
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; type: 'node' | 'edge' | null; id: string | null }>({
        visible: false,
        x: 0,
        y: 0,
        type: null,
        id: null,
    });
    const [isEditNodeModalVisible, setIsEditNodeModalVisible] = useState(false);
    const [editNodeData, setEditNodeData] = useState({ name: "", color: "#000000" });

    const [isEditEdgeModalVisible, setIsEditEdgeModalVisible] = useState(false);
    const [editEdgeWeight, setEditEdgeWeight] = useState<number | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const importRef = useRef<HTMLInputElement>(null);
    const longPressData = useRef<{ timer: NodeJS.Timeout | null; startX: number; startY: number }>({
        timer: null,
        startX: 0,
        startY: 0
    });

    // Close Context Menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [contextMenu]);

    const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

    const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (mode === 'editing') return;

        // This check is crucial: ensure we are clicking specifically on the canvas/svg, not bubbling up from a node
        // Checking if e.target is the canvas container directly
        if (!canvasRef.current || e.target !== canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const label = labelMode === 'letters'
            ? String.fromCharCode(65 + (nodes.length % 26)) + (nodes.length >= 26 ? Math.floor(nodes.length / 26) : '')
            : `${nodes.length + 1}`;

        const newNode: GraphNode = {
            id: `node-${Date.now()}`,
            x,
            y,
            label,
            color: getRandomColor(),
        };

        setNodes([...nodes, newNode]);
        setSelectedNode(null);
    };

    const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
        e.stopPropagation(); // Stop drag start from hitting canvas

        longPressData.current.startX = e.clientX;
        longPressData.current.startY = e.clientY;

        longPressData.current.timer = setTimeout(() => {
            setContextMenu({
                visible: true,
                x: longPressData.current.startX,
                y: longPressData.current.startY,
                type: 'node',
                id: nodeId,
            });
            setDraggingNode(null); // Cancel drag if it becomes a long press
        }, 500); // 500ms long press

        if (mode === 'editing') {
            if (e.button === 0 || e.pointerType === 'touch') {
                setDraggingNode(nodeId);
            }
        }
    };

    const handleNodePointerMove = (e: React.PointerEvent) => {
        if (longPressData.current.timer) {
            const dx = e.clientX - longPressData.current.startX;
            const dy = e.clientY - longPressData.current.startY;
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                clearTimeout(longPressData.current.timer);
                longPressData.current.timer = null;
            }
        }
    };

    const handleNodePointerUp = () => {
        if (longPressData.current.timer) {
            clearTimeout(longPressData.current.timer);
            longPressData.current.timer = null;
        }
    };

    const openContextMenu = (e: React.MouseEvent | React.PointerEvent, type: 'node' | 'edge', id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (mode === 'editing') {
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                type,
                id,
            });
        }
    };

    const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation(); // Prevent canvas click (creation)

        if (longPressData.current.timer) {
            clearTimeout(longPressData.current.timer);
            longPressData.current.timer = null;
        }

        if (mode === 'creation') {
            if (!selectedNode) {
                setSelectedNode(nodeId);
                message.info(t("Seleccione otro nodo para conectar"));
            } else {
                if (selectedNode === nodeId) {
                    // Self-loop creation
                    setPendingConnection({ source: selectedNode, target: nodeId });
                    setIsEdgeModalVisible(true);
                    return;
                }

                // Check for existing connection
                const exists = edges.some(
                    (edge) =>
                        (edge.source === selectedNode && edge.target === nodeId) ||
                        (!isDirected && edge.source === nodeId && edge.target === selectedNode)
                );

                if (exists) {
                    message.warning(t("Ya existe una conexión entre estos nodos"));
                    setSelectedNode(null);
                    return;
                }

                setPendingConnection({ source: selectedNode, target: nodeId });
                setIsEdgeModalVisible(true);
            }
        } else if (mode === 'editing') {
            // Context menu logic has moved to the long press event handler
        }
    };

    const handleEdgeClick = (e: React.MouseEvent, edgeId: string) => {
        e.stopPropagation();
        // context menu now only via long press
    };

    const edgeLongPressData = useRef<{ timer: NodeJS.Timeout | null; startX: number; startY: number }>({
        timer: null,
        startX: 0,
        startY: 0
    });

    const handleEdgeLabelPointerDown = (e: React.PointerEvent, edgeId: string) => {
        if (mode !== 'editing') return;
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

        edgeLongPressData.current.startX = e.clientX;
        edgeLongPressData.current.startY = e.clientY;

        edgeLongPressData.current.timer = setTimeout(() => {
            setContextMenu({
                visible: true,
                x: edgeLongPressData.current.startX,
                y: edgeLongPressData.current.startY,
                type: 'edge',
                id: edgeId,
            });
            setDraggingEdge(null); // cancel drag when long-press fires
        }, 500);

        setDraggingEdge(edgeId);
    };

    const handleEdgeLabelPointerMove = (e: React.PointerEvent, edgeId: string) => {
        if (edgeLongPressData.current.timer) {
            const dx = e.clientX - edgeLongPressData.current.startX;
            const dy = e.clientY - edgeLongPressData.current.startY;
            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
                clearTimeout(edgeLongPressData.current.timer);
                edgeLongPressData.current.timer = null;
            }
        }
    };

    const handleEdgeLabelPointerUp = () => {
        if (edgeLongPressData.current.timer) {
            clearTimeout(edgeLongPressData.current.timer);
            edgeLongPressData.current.timer = null;
        }
        setDraggingEdge(null);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (mode === 'editing' && draggingNode) {
            setNodes(nodes.map(n => n.id === draggingNode ? { ...n, x, y } : n));
        }

        if (mode === 'editing' && draggingEdge) {
            setEdges(edges.map(edge => {
                if (edge.id !== draggingEdge) return edge;
                const src = nodes.find(n => n.id === edge.source);
                const tgt = nodes.find(n => n.id === edge.target);
                if (!src || !tgt) return edge;
                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;
                return { ...edge, cpOffset: { dx: x - midX, dy: y - midY } };
            }));
        }
    };

    const handlePointerUp = () => {
        setDraggingNode(null);
        setDraggingEdge(null);
    };

    const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
        openContextMenu(e, 'node', nodeId);
    };

    const handleEdgeContextMenu = (e: React.MouseEvent, edgeId: string) => {
        openContextMenu(e, 'edge', edgeId);
    };

    const handleCreateEdge = () => {
        if (pendingConnection && edgeWeight !== null) {
            const newEdge: GraphEdge = {
                id: `edge-${Date.now()}`,
                source: pendingConnection.source,
                target: pendingConnection.target,
                weight: edgeWeight.toString(),
                isDirected,
                cpOffset: { dx: 0, dy: 0 },
            };

            setEdges([...edges, newEdge]);
            setSelectedNode(null);
            setPendingConnection(null);
            setEdgeWeight(null);
            setIsEdgeModalVisible(false);
            message.success(t("Conexión creada"));
        } else {
            message.warning(t("Ingrese un peso válido para la conexión"));
        }
    };

    const openEditModal = () => {
        if (contextMenu.type === 'node' && contextMenu.id) {
            const node = nodes.find(n => n.id === contextMenu.id);
            if (node) {
                setEditNodeData({ name: node.label, color: node.color });
                setIsEditNodeModalVisible(true);
                setContextMenu({ ...contextMenu, visible: false });
            }
        } else if (contextMenu.type === 'edge' && contextMenu.id) {
            const edge = edges.find(e => e.id === contextMenu.id);
            if (edge) {
                setEditEdgeWeight(Number(edge.weight));
                setIsEditEdgeModalVisible(true);
                setContextMenu({ ...contextMenu, visible: false });
            }
        }
    };

    const handleSaveNodeEdit = () => {
        if (contextMenu.type === 'node' && contextMenu.id) {
            setNodes(nodes.map(n => n.id === contextMenu.id ? { ...n, label: editNodeData.name, color: editNodeData.color } : n));
            setIsEditNodeModalVisible(false);
        }
    };

    const handleSaveEdgeEdit = () => {
        if (contextMenu.type === 'edge' && contextMenu.id && editEdgeWeight !== null) {
            setEdges(edges.map(e => e.id === contextMenu.id ? { ...e, weight: editEdgeWeight.toString() } : e));
            setIsEditEdgeModalVisible(false);
        }
    };

    const handleMatrixEdgeChange = (sourceId: string, targetId: string, value: string) => {
        setEdges(prevEdges => {
            // Find if there is an existing directed edge from source to target
            const existingEdgeIdx = prevEdges.findIndex(
                e => e.source === sourceId && e.target === targetId
            );

            if (value === "") {
                // Remove edge if it exists
                if (existingEdgeIdx !== -1) {
                    return prevEdges.filter((_, idx) => idx !== existingEdgeIdx);
                }
                return prevEdges; // No change
            } else {
                // Add or update
                let numValue = parseFloat(value);
                if (isNaN(numValue)) numValue = 0; // fallback

                if (existingEdgeIdx !== -1) {
                    // Update
                    const newEdges = [...prevEdges];
                    newEdges[existingEdgeIdx] = { ...newEdges[existingEdgeIdx], weight: numValue.toString() };
                    return newEdges;
                } else {
                    // Create new
                    const newId = `edge-${Date.now()}-${Math.random()}`;
                    return [...prevEdges, {
                        id: newId,
                        source: sourceId,
                        target: targetId,
                        weight: numValue.toString(),
                        isDirected: true, // Adjacency matrix is for directed graphs currently
                        cpOffset: { dx: 0, dy: 0 }
                    }];
                }
            }
        });
    };

    const handleDelete = () => {
        if (contextMenu.type === 'node' && contextMenu.id) {
            setNodes(nodes.filter(n => n.id !== contextMenu.id));
            setEdges(edges.filter(e => e.source !== contextMenu.id && e.target !== contextMenu.id));
            setContextMenu({ ...contextMenu, visible: false });
            message.success(t("Nodo eliminado"));
        } else if (contextMenu.type === 'edge' && contextMenu.id) {
            setEdges(edges.filter(e => e.id !== contextMenu.id));
            setContextMenu({ ...contextMenu, visible: false });
            message.success(t("Arista eliminada"));
        }
    };

    const toggleDirected = (checked: boolean) => {
        if (checked && !isDirected) {
            // Undirected -> Directed
            Modal.confirm({
                title: t("Cambiar a Dirigido"),
                content: t("Al cambiar a dirigido, se crearán rutas dobles (A->B y B->A) para mantener las conexiones existentes. ¿Desea continuar?"),
                onOk: () => {
                    const newEdges = [...edges];
                    // "creates 2 routes between each node... with the same weight"
                    // Existing edges are A-B (stored as source-target but implied bidirectional).
                    // We need to ensure for every A-B, there is a B-A.
                    // Since existing edges are chemically "Undirected", we treat "source" and "target" as endpoints.

                    const addedEdges: GraphEdge[] = [];
                    edges.forEach(edge => {
                        // Current edge becomes A->B Directed
                        edge.isDirected = true;

                        // Create B->A Directed
                        const newId = `edge-${Date.now()}-${Math.random()}`;
                        addedEdges.push({
                            id: newId,
                            source: edge.target,
                            target: edge.source,
                            weight: edge.weight,
                            isDirected: true,
                            cpOffset: { dx: 0, dy: 0 },
                        });
                    });

                    setEdges([...newEdges, ...addedEdges]);
                    setIsDirected(true);
                }
            });
        } else if (!checked && isDirected) {
            // Directed -> Undirected
            Modal.confirm({
                title: t("Cambiar a No Dirigido"),
                content: t("Al cambiar a no dirigido, las conexiones duplicadas (A->B y B->A) se fusionarán. ¿Desea continuar?"),
                onOk: () => {
                    const uniqueEdges: GraphEdge[] = [];
                    edges.forEach(edge => {
                        const reverseExists = uniqueEdges.find(e =>
                            (e.source === edge.target && e.target === edge.source) ||
                            (e.source === edge.source && e.target === edge.target)
                        );
                        if (!reverseExists) {
                            uniqueEdges.push({ ...edge, isDirected: false });
                        }
                    });
                    setEdges(uniqueEdges);
                    setIsDirected(false);
                }
            });
        }
    };

    // ─── Canvas Save / Load ──────────────────────────────────────────────────
    const saveCanvas = async () => {
        if (!canvasName.trim()) { message.warning(t("Ingrese un nombre para la pizarra")); return; }
        setSavingCanvas(true);
        try {
            const res = await fetch(`${API_URL}/canvases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: canvasName.trim(),
                    nodes,
                    edges,
                    config: { isDirected, showGrid, labelMode }
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            message.success(`${t("Pizarra guardada")}: ${data.name}`);
            setCanvasName('');
            setIsSaveModalVisible(false);
        } catch (err: any) {
            message.error(err.message || t("Error al guardar"));
        } finally {
            setSavingCanvas(false);
        }
    };

    const openLoadModal = async () => {
        setLoadingCanvases(true);
        setIsLoadModalVisible(true);
        try {
            const res = await fetch(`${API_URL}/canvases`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCanvasList(data);
        } catch (err: any) {
            message.error(err.message || t("Error al cargar pizarras"));
        } finally {
            setLoadingCanvases(false);
        }
    };

    const loadCanvas = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/canvases/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setNodes(data.data.nodes ?? []);
            setEdges(data.data.edges ?? []);
            if (data.data.config) {
                setIsDirected(data.data.config.isDirected ?? false);
                setShowGrid(data.data.config.showGrid ?? true);
                setLabelMode(data.data.config.labelMode ?? 'letters');
            }
            setSelectedNode(null);
            setIsLoadModalVisible(false);
            setIsSettingsModalVisible(false);
            message.success(`${t("Pizarra cargada")}: ${data.name}`);
        } catch (err: any) {
            message.error(err.message || t("Error al cargar pizarra"));
        }
    };

    const deleteCanvasEntry = async (id: string) => {
        await fetch(`${API_URL}/canvases/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        setCanvasList(prev => prev.filter(c => c.id !== id));
    };

    // ─── JSON Export / Import (guests only) ──────────────────────────────────
    const handleExportJSON = () => {
        setExportFileName('grafo');
        setIsExportModalVisible(true);
    };

    const doExportJSON = () => {
        const name = exportFileName.trim() || 'grafo';
        const data = {
            version: 1,
            nodes,
            edges,
            config: { isDirected, showGrid, labelMode },
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExportModalVisible(false);
        message.success(t('Grafo exportado correctamente'));
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (!data.nodes || !data.edges) throw new Error('Formato inválido');
                setNodes(data.nodes);
                setEdges(data.edges);
                if (data.config) {
                    if (data.config.isDirected !== undefined) setIsDirected(data.config.isDirected);
                    if (data.config.showGrid !== undefined) setShowGrid(data.config.showGrid);
                    if (data.config.labelMode) setLabelMode(data.config.labelMode);
                }
                setSelectedNode(null);
                setIsSettingsModalVisible(false);
                message.success(t('Grafo importado correctamente'));
            } catch {
                message.error(t('El archivo no es un grafo válido'));
            }
        };
        reader.readAsText(file);
        // reset input so the same file can be re-imported
        e.target.value = '';
    };

    const getEdgeGeometry = (edge: GraphEdge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);

        if (!sourceNode || !targetNode) return null;

        // Self-loop
        if (sourceNode.id === targetNode.id) {
            const { x, y } = sourceNode;
            const loopPath = `M ${x - 20},${y - 20} C ${x - 50},${y - 80} ${x + 50},${y - 80} ${x + 20},${y - 20}`;
            return { path: loopPath, labelX: x, labelY: y - 80, isLoop: true };
        }

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const angle = Math.atan2(dy, dx);
        const radius = 25;

        const startX = sourceNode.x + Math.cos(angle) * radius;
        const startY = sourceNode.y + Math.sin(angle) * radius;
        const endX = targetNode.x - Math.cos(angle) * radius;
        const endY = targetNode.y - Math.sin(angle) * radius;

        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;

        // For bidirectional pairs with no user offset, apply a default perpendicular curve
        const isBidirectional = isDirected && edges.some(e => e.source === edge.target && e.target === edge.source);
        const cpOffset = edge.cpOffset ?? { dx: 0, dy: 0 };
        const hasUserBend = cpOffset.dx !== 0 || cpOffset.dy !== 0;

        let ctrlX: number;
        let ctrlY: number;

        if (!hasUserBend && isBidirectional) {
            // Default perpendicular offset for bidirectional edges
            const dist = Math.sqrt(dx * dx + dy * dy);
            const normX = -dy / dist;
            const normY = dx / dist;
            ctrlX = midX + normX * 40;
            ctrlY = midY + normY * 40;
        } else {
            ctrlX = midX + cpOffset.dx;
            ctrlY = midY + cpOffset.dy;
        }

        // Compute label position on bezier at t=0.5
        const labelX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX;
        const labelY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;

        const isStraight = !hasUserBend && !isBidirectional;
        const path = isStraight
            ? `M ${startX},${startY} L ${endX},${endY}`
            : `M ${startX},${startY} Q ${ctrlX},${ctrlY} ${endX},${endY}`;

        return { path, labelX, labelY: isStraight ? labelY - 10 : labelY, isLoop: false };
    };

    return (
        <GraphContainer ref={containerRef} style={{ paddingTop: '2rem' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'stretch', width: '100%', flex: 1 }}>
                {!(withMatrix && isDirected && showMatrix) && (
                    <Sidebar visible={showInstructions}>
                        <div className="sidebar-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3><InfoCircleOutlined /> {t("Instrucciones")}</h3>
                                <Button
                                    type="text"
                                    icon={<CloseOutlined />}
                                    onClick={() => setShowInstructions(false)}
                                    style={{ color: '#a0aec0' }}
                                />
                            </div>

                            <h4>{t("Modo Creación")}</h4>
                            <ul>
                                <li><b>{t("Crear Nodo:")}</b> {t("Haz clic en cualquier espacio vacío del lienzo.")}</li>
                                <li><b>{t("Conectar Nodos:")}</b> {t("Haz clic en un nodo para seleccionarlo, luego clic en otro para crear una arista.")}</li>
                                <li><b>{t("Arista al mismo nodo:")}</b> {t("Haz clic en un nodo ya seleccionado (bucle).")}</li>
                            </ul>

                            <h4>{t("Modo Edición")}</h4>
                            <ul>
                                <li><b>{t("Mover Nodos:")}</b> {t("Arrastra un nodo a la posición deseada.")}</li>
                                <li><b>{t("Ajustar Curvatura:")}</b> {t("Arrastra el peso de una arista para modificar su curvatura.")}</li>
                                <li><b>{t("Editar / Eliminar:")}</b> {t("Mantén presionado un nodo o el peso de una arista para abrir el menú de opciones.")}</li>
                            </ul>
                        </div>
                    </Sidebar>
                )}

                <CanvasContainer style={{ flex: showInstructions && showMatrix ? '2' : '3', minWidth: 0 }}>
                    <Canvas
                        ref={canvasRef}
                        onPointerDown={handleCanvasPointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        mode={mode}
                        showGrid={showGrid}
                    >
                        {/* Floating Control Panel */}
                        <FloatingPanel visible={showPanel}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: 500 }}>{t("Modo")}:</span>
                                <Switch
                                    size="small"
                                    checkedChildren={t("Edición")}
                                    unCheckedChildren={t("Creación")}
                                    checked={mode === 'editing'}
                                    onChange={(checked) => setMode(checked ? 'editing' : 'creation')}
                                />
                            </div>
                            <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: 500 }}>{isDirected ? t("Dirigido") : t("No Dirigido")}:</span>
                                <Switch size="small" checked={isDirected} onChange={toggleDirected} />
                            </div>
                            <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)' }} />
                            <Button size="small" icon={<SettingOutlined />} type="text" onClick={() => setIsSettingsModalVisible(true)} style={{ color: '#2e186a' }} />
                            {withMatrix && isDirected && (
                                <>
                                    <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)' }} />
                                    <Button
                                        size="small"
                                        icon={<TableOutlined />}
                                        type="text"
                                        onClick={() => setShowMatrix(v => !v)}
                                        title={showMatrix ? t("Ocultar matriz") : t("Mostrar matriz")}
                                        style={{ color: showMatrix ? '#2e186a' : '#a0aec0' }}
                                    />
                                </>
                            )}
                        </FloatingPanel>
                        {/* Toggle button top-right */}
                        <PanelToggle onClick={() => setShowPanel(v => !v)} title={showPanel ? t("Ocultar controles") : t("Mostrar controles")}>
                            <ControlOutlined />
                        </PanelToggle>
                        <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                            {edges.map(edge => {
                                const geom = getEdgeGeometry(edge);
                                if (!geom) return null;
                                return (
                                    <g key={edge.id}>
                                        <path
                                            d={geom.path}
                                            stroke="#2e186a"
                                            strokeWidth="3"
                                            fill="none"
                                            markerEnd={edge.isDirected || isDirected ? `url(#arrowhead-${edge.id})` : undefined}
                                        />
                                        {(edge.isDirected || isDirected) && (
                                            <marker id={`arrowhead-${edge.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                                <polygon points="0 0, 10 3.5, 0 7" fill="#2e186a" />
                                            </marker>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>

                        {edges.map(edge => {
                            const geom = getEdgeGeometry(edge);
                            if (!geom) return null;
                            return (
                                <EdgeLabel
                                    key={`label-${edge.id}`}
                                    x={geom.labelX}
                                    y={geom.labelY}
                                    mode={mode}
                                    onContextMenu={(e) => handleEdgeContextMenu(e, edge.id)}
                                    onClick={(e) => handleEdgeClick(e, edge.id)}
                                    onPointerDown={(e) => handleEdgeLabelPointerDown(e, edge.id)}
                                    onPointerMove={(e) => handleEdgeLabelPointerMove(e, edge.id)}
                                    onPointerUp={handleEdgeLabelPointerUp}
                                    style={{ cursor: mode === 'editing' ? (draggingEdge === edge.id ? 'grabbing' : 'grab') : 'default' }}
                                >
                                    {edge.weight}
                                </EdgeLabel>
                            );
                        })}

                        {nodes.map((node) => (
                            <Node
                                key={node.id}
                                x={node.x}
                                y={node.y}
                                color={node.color}
                                isSelected={selectedNode === node.id}
                                onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                                onPointerMove={handleNodePointerMove}
                                onPointerUp={handleNodePointerUp}
                                onPointerLeave={handleNodePointerUp}
                                onClick={(e) => handleNodeClick(e, node.id)}
                                onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                            >
                                {node.label}
                            </Node>
                        ))}
                    </Canvas>
                </CanvasContainer>
                {/* Adjacency Matrix Panel with Instructions Below */}
                {withMatrix && isDirected && showMatrix && (
                    <div style={{ paddingTop: '0.5rem', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: '1rem', flex: showInstructions ? '0.7' : '1.5', minWidth: 0, paddingBottom: '1rem' }}>
                        <AdjacencyMatrix
                            nodes={nodes}
                            edges={edges}
                            editable={editableMatrix}
                            onEdgeChange={handleMatrixEdgeChange}
                        />
                        {showInstructions && (
                            <Sidebar visible={showInstructions} style={{ width: '100%', maxWidth: '100%', flexShrink: 0 }}>
                                <div className="sidebar-content" style={{ width: '100%', boxSizing: 'border-box' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3><InfoCircleOutlined /> {t("Instrucciones")}</h3>
                                        <Button
                                            type="text"
                                            icon={<CloseOutlined />}
                                            onClick={() => setShowInstructions(false)}
                                            style={{ color: '#a0aec0' }}
                                        />
                                    </div>

                                    <h4>{t("Modo Creación")}</h4>
                                    <ul>
                                        <li><b>{t("Crear Nodo:")}</b> {t("Haz clic en cualquier espacio vacío del lienzo.")}</li>
                                        <li><b>{t("Conectar Nodos:")}</b> {t("Haz clic en un nodo para seleccionarlo, luego clic en otro para crear una arista.")}</li>
                                        <li><b>{t("Arista al mismo nodo:")}</b> {t("Haz clic en un nodo ya seleccionado (bucle).")}</li>
                                        <li><b>{t("Matriz de Adyacencia:")}</b> {t("Edita directamente el valor de una celda para crear o actualizar una arista, o déjala vacía para eliminarla.")}</li>
                                    </ul>

                                    <h4>{t("Modo Edición")}</h4>
                                    <ul>
                                        <li><b>{t("Mover Nodos:")}</b> {t("Arrastra un nodo a la posición deseada.")}</li>
                                        <li><b>{t("Ajustar Curvatura:")}</b> {t("Arrastra el peso de una arista para modificar su curvatura.")}</li>
                                        <li><b>{t("Editar / Eliminar:")}</b> {t("Mantén presionado un nodo o el peso de una arista para abrir el menú de opciones.")}</li>
                                    </ul>
                                </div>
                            </Sidebar>
                        )}
                    </div>
                )}
            </div>

            {contextMenu.visible && (
                <ContextMenuContainer x={contextMenu.x} y={contextMenu.y} onClick={(e) => e.stopPropagation()}>
                    <ContextMenuItem onClick={openEditModal}>
                        <EditOutlined style={{ color: '#2e186a' }} />
                        {contextMenu.type === 'node' ? t("Editar Nodo") : t("Editar Peso")}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleDelete} style={{ color: '#f5222d' }}>
                        <DeleteOutlined />
                        {contextMenu.type === 'node' ? t("Eliminar Nodo") : t("Eliminar Arista")}
                    </ContextMenuItem>
                </ContextMenuContainer>
            )}


            <Modal
                title={<ModalTitle title={t("Crear Conexión")} />}
                open={isEdgeModalVisible}
                onOk={handleCreateEdge}
                onCancel={() => {
                    setIsEdgeModalVisible(false);
                    setPendingConnection(null);
                    setSelectedNode(null);
                }}
                centered
                closeIcon={null}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button shape="round" onClick={() => {
                            setIsEdgeModalVisible(false);
                            setPendingConnection(null);
                            setSelectedNode(null);
                        }}>{t("Cancelar")}</Button>
                        <Button shape="round" type="primary" onClick={handleCreateEdge} style={{ background: '#2e186a', borderColor: '#2e186a' }}>{t("Guardar")}</Button>
                    </div>
                }
            >
                <StyledModalContent>
                    <label>{t("Ingrese el peso de la ruta (numérico):")}</label>
                    <InputNumber
                        value={edgeWeight}
                        onChange={setEdgeWeight}
                        onPressEnter={handleCreateEdge}
                        autoFocus
                        style={{ width: '100%' }}
                        placeholder={t("Ej. 10")}
                    />
                </StyledModalContent>
            </Modal>

            <Modal
                title={<ModalTitle title={t("Configuración")} />}
                open={isSettingsModalVisible}
                onOk={() => setIsSettingsModalVisible(false)}
                onCancel={() => setIsSettingsModalVisible(false)}
                footer={null}
                centered
                closeIcon={null}
                bodyStyle={{ padding: '24px' }}
            >
                <StyledModalContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500, color: '#4a5568' }}>{t("Mostrar Cuadrícula")}</span>
                        <Switch checked={showGrid} onChange={setShowGrid} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500, color: '#4a5568' }}>{t("Mostrar Instrucciones")}</span>
                        <Switch checked={showInstructions} onChange={setShowInstructions} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500, color: '#4a5568' }}>{t("Etiquetas")}</span>
                        <Switch
                            checkedChildren={t("Letras")}
                            unCheckedChildren={t("Números")}
                            checked={labelMode === 'letters'}
                            onChange={(checked) => setLabelMode(checked ? 'letters' : 'numbers')}
                        />
                    </div>
                    {withMatrix && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500, color: '#4a5568' }}>{t("Editar Matriz Directamente")}</span>
                            <Switch checked={editableMatrix} onChange={setEditableMatrix} />
                        </div>
                    )}
                    {/* Canvas Save / Load — only when logged in */}
                    {user && (
                        <>
                            <div style={{ borderTop: '1px solid #eee', margin: '1rem 0' }} />
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button
                                    block
                                    icon={<SaveOutlined />}
                                    onClick={() => { setIsSettingsModalVisible(false); setIsSaveModalVisible(true); }}
                                >
                                    {t("Guardar Pizarra")}
                                </Button>
                                <Button
                                    block
                                    icon={<FolderOpenOutlined />}
                                    onClick={() => { setIsSettingsModalVisible(false); openLoadModal(); }}
                                >
                                    {t("Cargar Pizarra")}
                                </Button>
                            </div>
                        </>
                    )}
                    {/* JSON Export / Import — only for guests */}
                    {!user && (
                        <>
                            <div style={{ borderTop: '1px solid #eee', margin: '1rem 0' }} />
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button block icon={<DownloadOutlined />} onClick={handleExportJSON}>
                                    {t("Exportar JSON")}
                                </Button>
                                <Button block icon={<UploadOutlined />} onClick={() => importRef.current?.click()}>
                                    {t("Importar JSON")}
                                </Button>
                                <input
                                    ref={importRef}
                                    type="file"
                                    accept=".json"
                                    style={{ display: 'none' }}
                                    onChange={handleImportJSON}
                                />
                            </div>
                        </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button
                            shape="round"
                            danger
                            onClick={() => {
                                setNodes([]);
                                setEdges([]);
                                setSelectedNode(null);
                                message.success(t("Lienzo borrado"));
                                setIsSettingsModalVisible(false);
                            }}
                        >
                            {t("Borrar Todo")}
                        </Button>
                        <Button shape="round" type="primary" onClick={() => setIsSettingsModalVisible(false)} style={{ background: '#2e186a', borderColor: '#2e186a' }}>
                            {t("Cerrar")}
                        </Button>
                    </div>
                </StyledModalContent>
            </Modal>

            {/* ── Save Canvas Modal ─────────────────────────────────────────── */}
            <Modal
                title={<ModalTitle title={t("Guardar Pizarra")} />}
                open={isSaveModalVisible}
                onCancel={() => setIsSaveModalVisible(false)}
                footer={null}
                centered
                closeIcon={null}
            >
                <StyledModalContent>
                    <p style={{ color: '#4a5568', marginBottom: '0.75rem' }}>{t("Ingrese un nombre para la pizarra")}</p>
                    <Input
                        placeholder={t("Ej. Mi Grafo BFS")}
                        value={canvasName}
                        onChange={e => setCanvasName(e.target.value)}
                        onPressEnter={saveCanvas}
                        autoFocus
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem' }}>
                        <Button onClick={() => setIsSaveModalVisible(false)}>{t("Cancelar")}</Button>
                        <Button
                            type="primary"
                            loading={savingCanvas}
                            icon={<SaveOutlined />}
                            onClick={saveCanvas}
                            style={{ background: '#2e186a', borderColor: '#2e186a' }}
                        >
                            {t("Guardar")}
                        </Button>
                    </div>
                </StyledModalContent>
            </Modal>

            {/* ── Load Canvas Modal ─────────────────────────────────────────── */}
            <Modal
                title={<ModalTitle title={t("Cargar Pizarra")} />}
                open={isLoadModalVisible}
                onCancel={() => setIsLoadModalVisible(false)}
                footer={null}
                centered
                closeIcon={null}
                width={480}
            >
                <StyledModalContent>
                    {loadingCanvases ? (
                        <p style={{ textAlign: 'center', color: '#a0aec0' }}>{t("Cargando pizarras...")}</p>
                    ) : canvasList.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#a0aec0' }}>{t("No tienes pizarras guardadas")}</p>
                    ) : (
                        <List
                            dataSource={canvasList}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            type="primary"
                                            size="small"
                                            onClick={() => loadCanvas(item.id)}
                                            style={{ background: '#2e186a', borderColor: '#2e186a' }}
                                        >
                                            {t("Cargar")}
                                        </Button>,
                                        <Button
                                            danger
                                            size="small"
                                            onClick={() => deleteCanvasEntry(item.id)}
                                        >
                                            {t("Eliminar")}
                                        </Button>,
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={item.name}
                                        description={new Date(item.created_at).toLocaleDateString('es-BO')}
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </StyledModalContent>
            </Modal>

            <Modal
                title={<ModalTitle title={t("Editar Nodo")} />}
                open={isEditNodeModalVisible}
                onOk={handleSaveNodeEdit}
                onCancel={() => setIsEditNodeModalVisible(false)}
                centered
                closeIcon={null}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button shape="round" onClick={() => setIsEditNodeModalVisible(false)}>{t("Cancelar")}</Button>
                        <Button shape="round" type="primary" onClick={handleSaveNodeEdit} style={{ background: '#2e186a', borderColor: '#2e186a' }}>{t("Guardar")}</Button>
                    </div>
                }
            >
                <StyledModalContent>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <label>{t("Nombre del Nodo")}</label>
                            <Input
                                value={editNodeData.name}
                                onChange={(e) => setEditNodeData({ ...editNodeData, name: e.target.value })}
                                onPressEnter={handleSaveNodeEdit}
                                autoFocus
                            />
                        </Col>
                        <Col span={24}>
                            <label>{t("Color")}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    type="color"
                                    value={editNodeData.color}
                                    onChange={(e) => setEditNodeData({ ...editNodeData, color: e.target.value })}
                                    style={{ width: '40px', height: '40px', cursor: 'pointer', border: 'none', borderRadius: '50%', padding: 0, overflow: 'hidden' }}
                                />
                                <span style={{ fontFamily: 'monospace', color: '#4a5568', background: '#f7fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                    {editNodeData.color}
                                </span>
                            </div>
                        </Col>
                    </Row>
                </StyledModalContent>
            </Modal>

            <Modal
                title={<ModalTitle title={t("Editar Arista")} />}
                open={isEditEdgeModalVisible}
                onOk={handleSaveEdgeEdit}
                onCancel={() => setIsEditEdgeModalVisible(false)}
                centered
                closeIcon={null}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button shape="round" onClick={() => setIsEditEdgeModalVisible(false)}>{t("Cancelar")}</Button>
                        <Button shape="round" type="primary" onClick={handleSaveEdgeEdit} style={{ background: '#2e186a', borderColor: '#2e186a' }}>{t("Guardar")}</Button>
                    </div>
                }
            >
                <StyledModalContent>
                    <label>{t("Peso de la ruta (numérico)")}</label>
                    <InputNumber
                        value={editEdgeWeight}
                        onChange={setEditEdgeWeight}
                        onPressEnter={handleSaveEdgeEdit}
                        autoFocus
                        style={{ width: '100%' }}
                        placeholder={t("Ej. 10")}
                    />
                </StyledModalContent>
            </Modal>
            {/* ── Export JSON Name Modal ────────────────────────────────────── */}
            <Modal
                title={<ModalTitle title={t('Exportar JSON')} />}
                open={isExportModalVisible}
                onCancel={() => setIsExportModalVisible(false)}
                footer={null}
                centered
                closeIcon={null}
            >
                <StyledModalContent>
                    <p style={{ color: '#4a5568', marginBottom: '0.75rem' }}>{t('Ingrese el nombre del archivo JSON')}</p>
                    <Input
                        placeholder={t('Ej. mi-grafo')}
                        value={exportFileName}
                        onChange={e => setExportFileName(e.target.value)}
                        onPressEnter={doExportJSON}
                        autoFocus
                        addonAfter=".json"
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem' }}>
                        <Button onClick={() => setIsExportModalVisible(false)}>{t('Cancelar')}</Button>
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={doExportJSON}
                            style={{ background: '#2e186a', borderColor: '#2e186a' }}
                        >
                            {t('Exportar')}
                        </Button>
                    </div>
                </StyledModalContent>
            </Modal>
        </GraphContainer >
    );
};

export default GraphEditor;
