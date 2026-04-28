import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { Switch, Modal, Input, Button, message, InputNumber, Slider, List } from "antd";
import {
    PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined,
    SettingOutlined, DeleteOutlined, EditOutlined, InfoCircleOutlined,
    ControlOutlined, TableOutlined, SaveOutlined, FolderOpenOutlined,
    DownloadOutlined, UploadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAuth, API_URL } from "../../context/AuthContext";


// ─── Types ────────────────────────────────────────────────────────────────────
interface GraphNode { id: string; x: number; y: number; label: string; color: string; }
interface GraphEdge {
    id: string; source: string; target: string; weight: string;
    isDirected: boolean; cpOffset: { dx: number; dy: number };
}

type SimState = 'idle' | 'running' | 'paused' | 'done';

// ─── Styled Components ────────────────────────────────────────────────────────
const pulse = keyframes`0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0.4)} 50%{box-shadow:0 0 0 8px rgba(139,92,246,0)}`;
const fadeIn = keyframes`from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}`;

const Wrap = styled.div`
  display: flex; flex-direction: column; min-height: calc(100vh - 60px);
  padding: 1rem 2rem 2rem; gap: 1rem;
`;

const SimBar = styled.div`
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  background: white; padding: 0.75rem 1.25rem; border-radius: 16px;
  box-shadow: 0 4px 12px rgba(46,24,106,0.08);
  justify-content: flex-start;
`;

const SimBarLabel = styled.span`
  font-size: 0.82rem; color: #4a5568; font-weight: 500;
`;

const EditorWrap = styled.div`
  display: flex; gap: 0.75rem; flex: 1; align-items: stretch;
  min-width: 0; overflow: hidden;
`;

const CanvasOuter = styled.div`
  flex: 1; min-width: 0; display: flex; flex-direction: column;
  border-radius: 20px; overflow: hidden;
  box-shadow: 0 4px 12px rgba(46,24,106,0.08);
  background: white; position: relative;
`;

interface CanvasProps { mode: string; showGrid: boolean; }
const CanvasSVG = styled.div<CanvasProps>`
  flex: 1; position: relative; min-height: 500px; cursor: ${p => p.mode === 'creation' ? 'crosshair' : 'default'};
  background-image: ${p => p.showGrid
        ? 'radial-gradient(circle, #cbd5e0 1px, transparent 1px)'
        : 'none'};
  background-size: 28px 28px;
  background-position: 14px 14px;
`;

interface FloatingPanelProps { visible: boolean; }
const FloatingPanel = styled.div<FloatingPanelProps>`
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px; z-index: 10;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
  border-radius: 50px; padding: 6px 14px;
  box-shadow: 0 4px 16px rgba(46,24,106,0.12);
  opacity: ${p => p.visible ? 1 : 0}; pointer-events: ${p => p.visible ? 'auto' : 'none'};
  transition: opacity 0.3s;
`;

const PanelToggle = styled.button`
  position: absolute; bottom: 10px; right: 10px; z-index: 10;
  background: rgba(255,255,255,0.85); border: none; border-radius: 50%;
  width: 32px; height: 32px; cursor: pointer; font-size: 1rem; color: #2e186a;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
`;

const LeftSidebar = styled.div<{ w: number }>`
  width: ${p => p.w}px; flex-shrink: 0;
  background: white; border-radius: 16px; padding: 1.25rem 1rem;
  box-shadow: 0 4px 12px rgba(46,24,106,0.08);
  display: flex; flex-direction: column; gap: 0.5rem;
  overflow-y: auto; max-height: 700px; transition: none;
`;

const ResizeHandle = styled.div<{ axis?: 'v' | 'h' }>`
  flex-shrink: 0;
  width: ${p => p.axis === 'h' ? '8px' : '100%'};
  height: ${p => p.axis === 'h' ? '100%' : '8px'};
  cursor: ${p => p.axis === 'h' ? 'col-resize' : 'row-resize'};
  background: transparent;
  border-radius: 4px;
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  &::after {
    content: '';
    display: block;
    width: ${p => p.axis === 'h' ? '2px' : '100%'};
    height: ${p => p.axis === 'h' ? '40px' : '2px'};
    background: #e2e8f0;
    border-radius: 2px;
    transition: background 0.2s;
  }
  &:hover::after { background: #8b5cf6; }
  &:active::after { background: #6d28d9; }
`;

const RightPanel = styled.div<{ w: number }>`
  width: ${p => p.w}px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 1rem;
  min-width: 180px; transition: none;
`;

// Regular node circle
const NodeCircle = styled.div<{ color: string; isSelected: boolean; isCritical?: boolean; isActive?: boolean; }>`
  position: absolute; width: 50px; height: 50px; border-radius: 50%;
  transform: translate(-50%, -50%);
  background: ${p => p.color};
  border: ${p => p.isCritical ? '3px solid #ef4444' : p.isSelected ? '3px solid #8b5cf6' : '3px solid transparent'};
  color: white; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.9rem; cursor: pointer; user-select: none; touch-action: none;
  z-index: 5; transition: border-color 0.3s, transform 0.15s;
  ${p => p.isActive && css`animation: ${pulse} 1s infinite;`}
  &:hover { transform: translate(-50%, -50%) scale(1.08); }
`;

const KruskalNode = styled.div<{ color: string; isSelected: boolean; isCritical?: boolean; isActive?: boolean; }>`
  position: absolute; width: 60px; height: 60px; border-radius: 50%;
  transform: translate(-50%, -50%);
  border: ${p => p.isCritical ? '3px solid #ef4444' : p.isSelected ? '3px solid #8b5cf6' : '3px solid #c7d2fe'};
  background: white;
  overflow: hidden; cursor: pointer; user-select: none; touch-action: none;
  z-index: 5; transition: border-color 0.3s, transform 0.15s;
  display: flex; flex-direction: column;
  box-shadow: 0 2px 8px rgba(46,24,106,0.13);
  ${p => p.isActive && css`animation: ${pulse} 1s infinite;`}
  &:hover { transform: translate(-50%, -50%) scale(1.05); }
`;

const DLabel = styled.div<{ color: string }>`
  background: ${p => p.color}; color: white;
  font-weight: 700; font-size: 0.8rem;
  display: flex; align-items: center; justify-content: center;
  height: 50%; border-bottom: 1.5px solid rgba(255,255,255,0.3);
`;

const DDist = styled.div<{ hasValue?: boolean }>`
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700;
  background: #fef3c7; color: ${p => p.hasValue ? '#92400e' : '#b0b8c9'};
`;

interface EdgeLabelProps { x: number; y: number; mode: string; }
const EdgeLabelEl = styled.div<EdgeLabelProps>`
  position: absolute; left: ${p => p.x}px; top: ${p => p.y}px;
  transform: translate(-50%, -50%);
  background: white; border-radius: 6px; padding: 2px 6px;
  font-size: 0.72rem; font-weight: 700; color: #2e186a;
  border: 1.5px solid #c4b5fd;
  cursor: ${p => p.mode === 'editing' ? 'grab' : 'default'};
  user-select: none; touch-action: none; z-index: 6;
`;



const SummaryPanel = styled.div`
  background: white; border-radius: 16px; padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 12px rgba(46,24,106,0.08);
  animation: ${fadeIn} 0.4s ease;
`;

const ContextMenuEl = styled.div<{ x: number; y: number }>`
  position: fixed; left: ${p => p.x}px; top: ${p => p.y}px;
  background: white; border-radius: 10px; z-index: 1000;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 4px; min-width: 150px;
`;

const ContextMenuItemEl = styled.div`
  padding: 8px 12px; border-radius: 7px; cursor: pointer; display: flex;
  align-items: center; gap: 8px; font-size: 0.85rem; color: #2e186a;
  &:hover { background: #f5f3ff; }
`;

const ModalTitle = ({ title }: { title: string }) => (
    <div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, color: '#2e186a' }}>{title}</div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COLORS = ["#2e186a", "#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#eb2f96", "#13c2c2"];



// ─── Main Component ────────────────────────────────────────────────────────────
const Kruskal: React.FC = () => {
    useTranslation();

    // ── Graph state ──────────────────────────────────────────────────
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [mode, setMode] = useState<'creation' | 'editing'>('creation');
    const [showGrid, setShowGrid] = useState(true);
    const [showPanel, setShowPanel] = useState(true);
    const [showMatrix, setShowMatrix] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [editableMatrix, setEditableMatrix] = useState(false);
    // ── Resizable panel widths ───────────────────────────────────────
    const [leftWidth, setLeftWidth] = useState(220);
    const [rightWidth, setRightWidth] = useState(320);
    const resizingRef = useRef<{ panel: 'left' | 'right'; startX: number; startW: number } | null>(null);

    // Use global document listeners — most reliable resize pattern
    const startResize = useCallback((panel: 'left' | 'right', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startW = panel === 'left' ? leftWidth : rightWidth;
        resizingRef.current = { panel, startX: e.clientX, startW };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMove = (ev: MouseEvent) => {
            const r = resizingRef.current;
            if (!r) return;
            const delta = ev.clientX - r.startX;
            if (r.panel === 'left') {
                setLeftWidth(Math.max(140, Math.min(420, r.startW + delta)));
            } else {
                // Handle sits on LEFT edge of matrix: drag left grows it, drag right shrinks it
                setRightWidth(Math.max(180, Math.min(520, r.startW - delta)));
            }
        };

        const onUp = () => {
            resizingRef.current = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [leftWidth, rightWidth]);
    const [labelMode, setLabelMode] = useState<'letters' | 'numbers'>('letters');
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [draggingEdge, setDraggingEdge] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [edgeWeight, setEdgeWeight] = useState<number | null>(1);
    const [edgeWeightError, setEdgeWeightError] = useState(false);
    const [isEdgeModalVisible, setIsEdgeModalVisible] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: 'node' as 'node' | 'edge', id: '' });
    const [editNodeData, setEditNodeData] = useState({ name: '', color: '' });
    const [isEditNodeModalVisible, setIsEditNodeModalVisible] = useState(false);
    const [editEdgeWeight, setEditEdgeWeight] = useState<number | null>(null);
    const [editEdgeWeightError, setEditEdgeWeightError] = useState(false);
    const [isEditEdgeModalVisible, setIsEditEdgeModalVisible] = useState(false);
    const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
    const [optimizationGoal, setOptimizationGoal] = useState<'min' | 'max'>('max');

    // ── Simulation state ─────────────────────────────────────────────
    const [simState, setSimState] = useState<SimState>('idle');
    const [simSpeed, setSimSpeed] = useState(1200); // slider value: 1500=slowest(left) 10=fastest(right)
    const simSpeedRef = useRef(310); // actual delay = 1510 - sliderValue
    const [distances, setDistances] = useState<Record<string, number>>({});
    const [predecessors, setPredecessors] = useState<Record<string, string[]>>({});
    const [slacks, setSlacks] = useState<Record<string, number | null>>({});
    const [criticalEdges, setCriticalEdges] = useState<Set<string>>(new Set());
    const [activeNode, setActiveNode] = useState<string | null>(null);
    const [activeEdge, setActiveEdge] = useState<string | null>(null);
    const [criticalPath, setCriticalPath] = useState<string[][]>([]);
    const [criticalNodes, setCriticalNodes] = useState<Set<string>>(new Set());
    const simAbort = useRef(false);

    const canvasRef = useRef<HTMLDivElement>(null);
    const longPressData = useRef<{ timer: NodeJS.Timeout | null; startX: number; startY: number }>({ timer: null, startX: 0, startY: 0 });
    const edgeLongPressData = useRef<{ timer: NodeJS.Timeout | null; startX: number; startY: number }>({ timer: null, startX: 0, startY: 0 });
    const importRef = useRef<HTMLInputElement>(null);


    const { user, token } = useAuth();

    // Only block editing while simulation is actively running or paused
    // When 'done', the user can freely edit the graph and re-run
    const isSimActive = simState === 'running' || simState === 'paused';

    // ── Save/Load state ────────────────────────────────────────────────
    const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
    const [isLoadModalVisible, setIsLoadModalVisible] = useState(false);
    const [canvasName, setCanvasName] = useState('');
    const [canvasList, setCanvasList] = useState<{ id: string; name: string; created_at: string }[]>([]);
    const [savingCanvas, setSavingCanvas] = useState(false);
    const [loadingCanvases, setLoadingCanvases] = useState(false);

    // JSON Export name modal
    const [isExportModalVisible, setIsExportModalVisible] = useState(false);
    const [exportFileName, setExportFileName] = useState('grafo-kruskal');

    useEffect(() => {
        const h = () => setContextMenu(c => ({ ...c, visible: false }));
        document.addEventListener('click', h);
        return () => document.removeEventListener('click', h);
    }, []);
    // Inverted: slider left=1500(slow) → delay=1510-1500=10ms  |  slider right=10(fast) → delay=1500ms
    // Wait — user wants left slow right fast: sliderValue high=slow, sliderValue low=fast
    // delay = sliderValue (slider IS the delay, but displayed reversed)
    useEffect(() => { simSpeedRef.current = 1510 - simSpeed; }, [simSpeed]);

    const sleep = () => new Promise<void>(res => setTimeout(res, simSpeedRef.current));

    // ── Validate Graph ────────────────────────────────────────────────
    const validateGraph = useCallback((): string | null => {
        if (nodes.length < 2) return "El grafo debe tener al menos 2 nodos.";
        if (edges.length === 0) return "El grafo debe tener al menos una arista.";
        return null;
    }, [nodes, edges]);

    // Derived: live validity for indicator badge
    const graphValid = useMemo(() => validateGraph() === null, [validateGraph]);

    // ── Run CPM simulation ────────────────────────────────────────────
    const runSimulation = useCallback(async (goal: 'min' | 'max') => {
        const err = validateGraph();
        if (err) { Modal.error({ title: "Grafo inválido para Kruskal", content: err, centered: true }); return; }

        simAbort.current = false;
        setSimState('running');
        setCriticalEdges(new Set());
        setCriticalNodes(new Set());
        setCriticalPath([]);
        setDistances({});
        setPredecessors({});
        setActiveNode(null);
        setActiveEdge(null);

        // Build undirected edge list (deduplicate bidirectional)
        const seen = new Set<string>();
        const undirEdges: { id: string; src: string; tgt: string; w: number }[] = [];
        for (const e of edges) {
            const key = [e.source, e.target].sort().join('|');
            if (!seen.has(key)) {
                seen.add(key);
                undirEdges.push({ id: e.id, src: e.source, tgt: e.target, w: parseFloat(e.weight || '1') });
            }
        }

        const sorted = [...undirEdges].sort((a, b) => goal === 'min' ? a.w - b.w : b.w - a.w);
        const nodeIds = nodes.map(n => n.id);

        // Union-Find factory
        const mkUF = (ids: string[]) => {
            const p: Record<string, string> = {};
            const r: Record<string, number> = {};
            ids.forEach(id => { p[id] = id; r[id] = 0; });
            const find = (x: string): string => { if (p[x] !== x) p[x] = find(p[x]); return p[x]; };
            const union = (a: string, b: string): boolean => {
                const ra = find(a), rb = find(b);
                if (ra === rb) return false;
                if (r[ra] < r[rb]) p[ra] = rb;
                else if (r[ra] > r[rb]) p[rb] = ra;
                else { p[rb] = ra; r[ra]++; }
                return true;
            };
            return { find, union };
        };

        // --- Animated greedy pass (primary MST) ---
        const uf = mkUF(nodeIds);
        const mstEdgeIds = new Set<string>();
        const mstNodeSet = new Set<string>();
        let totalWeight = 0;

        for (const e of sorted) {
            if (simAbort.current) { setSimState('idle'); return; }
            setActiveEdge(e.id);
            await sleep();
            if (uf.find(e.src) !== uf.find(e.tgt)) {
                uf.union(e.src, e.tgt);
                mstEdgeIds.add(e.id);
                mstNodeSet.add(e.src);
                mstNodeSet.add(e.tgt);
                totalWeight += e.w;
                setCriticalEdges(new Set(mstEdgeIds));
                setCriticalNodes(new Set(mstNodeSet));
                setActiveNode(e.src);
                await sleep();
                setActiveNode(e.tgt);
                await sleep();
            }
            setActiveEdge(null);
        }

        // --- Find ALL equivalent MSTs via backtracking on weight groups ---
        const wGroups: { w: number; es: typeof undirEdges }[] = [];
        for (const e of sorted) {
            const last = wGroups[wGroups.length - 1];
            if (last && last.w === e.w) last.es.push(e);
            else wGroups.push({ w: e.w, es: [e] });
        }

        const allMSTs: string[][] = [];
        const targetEC = nodeIds.length - 1;

        const backtrack = (gIdx: number, chosen: string[]) => {
            if (allMSTs.length >= 6) return;
            if (chosen.length === targetEC) { allMSTs.push([...chosen]); return; }
            if (gIdx >= wGroups.length) return;
            const group = wGroups[gIdx];
            const trySubsets = (idx2: number, sub: string[]) => {
                if (allMSTs.length >= 6) return;
                if (chosen.length + sub.length === targetEC) { backtrack(gIdx + 1, [...chosen, ...sub]); return; }
                if (idx2 >= group.es.length) { backtrack(gIdx + 1, [...chosen, ...sub]); return; }
                const e2 = group.es[idx2];
                const uf2 = mkUF(nodeIds);
                [...chosen, ...sub].forEach(eid => { const ed = undirEdges.find(x => x.id === eid); if (ed) uf2.union(ed.src, ed.tgt); });
                if (uf2.find(e2.src) !== uf2.find(e2.tgt)) trySubsets(idx2 + 1, [...sub, e2.id]);
                trySubsets(idx2 + 1, sub);
            };
            trySubsets(0, []);
        };
        backtrack(0, []);

        // Convert to display labels
        const mstSummaries: string[][] = allMSTs.map(edgeIds =>
            edgeIds.map(eid => {
                const ed = undirEdges.find(x => x.id === eid);
                if (!ed) return eid;
                const sn = nodes.find(n => n.id === ed.src);
                const tn = nodes.find(n => n.id === ed.tgt);
                return `${sn?.label ?? ed.src}—${tn?.label ?? ed.tgt}(${ed.w})`;
            })
        );

        setCriticalPath(mstSummaries);
        setDistances({ __total__: totalWeight } as any);
        setActiveNode(null);
        setActiveEdge(null);
        setSimState('done');
    }, [nodes, edges, validateGraph]);

    const stopSimulation = () => {
        simAbort.current = true;
        setSimState('idle');
        setActiveNode(null);
        setActiveEdge(null);
    };

    const resetSimulation = () => {
        simAbort.current = true;
        setSimState('idle');
        setActiveNode(null);
        setActiveEdge(null);
        setDistances({});
        setPredecessors({});
        
        setCriticalEdges(new Set());
        setCriticalNodes(new Set());
        setCriticalPath([]);
    };

    // ── Save / Load canvas ────────────────────────────────────────────────
    const saveCanvas = async () => {
        if (!canvasName.trim()) { message.warning('Ingrese un nombre para la pizarra'); return; }
        setSavingCanvas(true);
        try {
            const res = await fetch(`${API_URL}/canvases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: canvasName.trim(), nodes, edges, config: { showGrid, labelMode } }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            message.success(`Pizarra guardada: ${data.name}`);
            setCanvasName(''); setIsSaveModalVisible(false);
        } catch (err: any) { message.error(err.message || 'Error al guardar'); }
        finally { setSavingCanvas(false); }
    };

    const openLoadModal = async () => {
        setLoadingCanvases(true); setIsLoadModalVisible(true);
        try {
            const res = await fetch(`${API_URL}/canvases`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCanvasList(data);
        } catch (err: any) { message.error(err.message || 'Error al cargar pizarras'); }
        finally { setLoadingCanvases(false); }
    };

    const loadCanvas = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/canvases/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setNodes(data.data.nodes ?? []);
            setEdges(data.data.edges ?? []);
            if (data.data.config) {
                setShowGrid(data.data.config.showGrid ?? true);
                setLabelMode(data.data.config.labelMode ?? 'letters');
            }
            setSelectedNode(null); setIsLoadModalVisible(false); resetSimulation();
            message.success(`Pizarra cargada: ${data.name}`);
        } catch (err: any) { message.error(err.message || 'Error al cargar pizarra'); }
    };

    const deleteCanvasEntry = async (id: string) => {
        await fetch(`${API_URL}/canvases/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        setCanvasList(prev => prev.filter(c => c.id !== id));
    };

    // ─── JSON Export / Import (guests only) ──────────────────────────────────
    const handleExportJSON = () => {
        setExportFileName('grafo-kruskal');
        setIsExportModalVisible(true);
    };

    const doExportJSON = () => {
        const name = exportFileName.trim() || 'grafo-kruskal';
        const data = {
            version: 1,
            nodes,
            edges,
            config: { showGrid, labelMode },
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExportModalVisible(false);
        message.success('Grafo exportado correctamente');
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
                    if (data.config.showGrid !== undefined) setShowGrid(data.config.showGrid);
                    if (data.config.labelMode) setLabelMode(data.config.labelMode);
                }
                resetSimulation();
                setIsSettingsOpen(false);
                message.success('Grafo importado correctamente');
            } catch {
                message.error('El archivo no es un grafo válido');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleClearAll = () => {
        Modal.confirm({
            title: '¿Borrar todo?',
            content: 'Se eliminarán todos los nodos y aristas actuales. Esta acción no se puede deshacer.',
            okText: 'Sí, borrar todo',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: () => {
                setNodes([]);
                setEdges([]);
                setSelectedNode(null);
                setPendingConnection(null);
                resetSimulation();
                message.success('Grafo borrado correctamente');
            }
        });
    };


    const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

    const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isSimActive || mode === 'editing') return;
        if (!canvasRef.current || e.target !== canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const label = labelMode === 'letters'
            ? String.fromCharCode(65 + (nodes.length % 26)) + (nodes.length >= 26 ? Math.floor(nodes.length / 26) : '')
            : `${nodes.length + 1}`;
        setNodes(prev => [...prev, { id: `node-${Date.now()}`, x, y, label, color: getRandomColor() }]);
        setSelectedNode(null);
    };

    const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
        e.stopPropagation();
        if (isSimActive) return;
        longPressData.current.startX = e.clientX;
        longPressData.current.startY = e.clientY;
        longPressData.current.timer = setTimeout(() => {
            setContextMenu({ visible: true, x: longPressData.current.startX, y: longPressData.current.startY, type: 'node', id: nodeId });
            setDraggingNode(null);
        }, 500);
        if (mode === 'editing') setDraggingNode(nodeId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggingNode || !canvasRef.current) return;
        const lt = longPressData.current;
        if (lt.timer && (Math.abs(e.clientX - lt.startX) > 10 || Math.abs(e.clientY - lt.startY) > 10)) {
            clearTimeout(lt.timer); lt.timer = null;
        }
        const rect = canvasRef.current.getBoundingClientRect();
        setNodes(prev => prev.map(n => n.id === draggingNode ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n));
    };

    const handlePointerUp = () => {
        if (longPressData.current.timer) { clearTimeout(longPressData.current.timer); longPressData.current.timer = null; }
        setDraggingNode(null);
    };

    const handleNodePointerMove = (e: React.PointerEvent) => {
        const lt = longPressData.current;
        if (lt.timer && (Math.abs(e.clientX - lt.startX) > 10 || Math.abs(e.clientY - lt.startY) > 10)) {
            clearTimeout(lt.timer); lt.timer = null;
        }
    };

    const handleNodePointerUp = () => {
        if (longPressData.current.timer) { clearTimeout(longPressData.current.timer); longPressData.current.timer = null; }
    };

    const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        if (isSimActive) return;
        if (longPressData.current.timer) { clearTimeout(longPressData.current.timer); longPressData.current.timer = null; }
        if (mode !== 'creation') return;
        if (!selectedNode) { setSelectedNode(nodeId); message.info("Haz clic en otro nodo para conectar"); return; }
        // Block self-loops — CPM/Dijkstra requires a DAG
        if (selectedNode === nodeId) {
            message.error("No se permiten bucles (self-loops).");
            setSelectedNode(null);
            return;
        }
        const exists = edges.some(edge => edge.source === selectedNode && edge.target === nodeId);
        if (exists) { message.warning("Ya existe una arista entre estos nodos"); setSelectedNode(null); return; }
        
        setPendingConnection({ source: selectedNode, target: nodeId });
        setEdgeWeightError(false);
        setIsEdgeModalVisible(true);
    };

    const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
        e.preventDefault(); e.stopPropagation();
        if (!isSimActive) setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'node', id: nodeId });
    };

    const handleCreateEdge = () => {
        if (!pendingConnection) return;
        const w = edgeWeight ?? 1;
        
        setEdges(prev => [...prev, {
            id: `edge-${Date.now()}`, source: pendingConnection.source, target: pendingConnection.target,
            weight: w.toString(), isDirected: true, cpOffset: { dx: 0, dy: 0 }
        }]);
        setIsEdgeModalVisible(false); setPendingConnection(null); setSelectedNode(null); setEdgeWeight(1); setEdgeWeightError(false);
        message.success("Arista creada");
    };

    const handleDelete = () => {
        if (contextMenu.type === 'node') {
            setNodes(n => n.filter(nd => nd.id !== contextMenu.id));
            setEdges(e => e.filter(ed => ed.source !== contextMenu.id && ed.target !== contextMenu.id));
            message.success("Nodo eliminado");
        } else {
            setEdges(e => e.filter(ed => ed.id !== contextMenu.id));
            message.success("Arista eliminada");
        }
        setContextMenu(c => ({ ...c, visible: false }));
    };

    const openEditModal = () => {
        if (contextMenu.type === 'node') {
            const node = nodes.find(n => n.id === contextMenu.id);
            if (node) { setEditNodeData({ name: node.label, color: node.color }); setIsEditNodeModalVisible(true); }
        } else {
            const edge = edges.find(e => e.id === contextMenu.id);
            if (edge) { setEditEdgeWeight(Number(edge.weight)); setEditEdgeWeightError(false); setIsEditEdgeModalVisible(true); }
        }
        setContextMenu(c => ({ ...c, visible: false }));
    };

    const handleEditEdge = () => {
        if (editEdgeWeight !== null) {
            
            setEdges(es => es.map(e => e.id === contextMenu.id ? { ...e, weight: editEdgeWeight.toString() } : e));
        }
        setIsEditEdgeModalVisible(false);
        setEditEdgeWeightError(false);
    };

    // Edge long press drag
    const handleEdgeLabelPointerDown = (e: React.PointerEvent, edgeId: string) => {
        if (isSimActive) return;
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        edgeLongPressData.current = { timer: null, startX: e.clientX, startY: e.clientY };
        edgeLongPressData.current.timer = setTimeout(() => {
            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'edge', id: edgeId });
        }, 500);
        if (mode === 'editing') setDraggingEdge(edgeId);
    };

    const handleEdgeLabelPointerMove = (e: React.PointerEvent, edgeId: string) => {
        const lp = edgeLongPressData.current;
        if (lp.timer && (Math.abs(e.clientX - lp.startX) > 8 || Math.abs(e.clientY - lp.startY) > 8)) {
            clearTimeout(lp.timer); lp.timer = null;
        }
        if (!draggingEdge) return;
        const edge = edges.find(ed => ed.id === edgeId); if (!edge) return;
        const src = nodes.find(n => n.id === edge.source); const tgt = nodes.find(n => n.id === edge.target); if (!src || !tgt) return;
        const midX = (src.x + tgt.x) / 2; const midY = (src.y + tgt.y) / 2;
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const dx = (e.clientX - rect.left) - midX; const dy = (e.clientY - rect.top) - midY;
        setEdges(prev => prev.map(ed => ed.id === edgeId ? { ...ed, cpOffset: { dx, dy } } : ed));
    };

    const handleEdgeLabelPointerUp = () => {
        if (edgeLongPressData.current.timer) { clearTimeout(edgeLongPressData.current.timer); edgeLongPressData.current.timer = null; }
        setDraggingEdge(null);
    };

    const handleEdgeContextMenu = (e: React.MouseEvent, edgeId: string) => {
        e.preventDefault(); e.stopPropagation();
        if (!isSimActive) setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'edge', id: edgeId });
    };

    // Matrix edge change
    const handleMatrixEdgeChange = (sourceId: string, targetId: string, value: string) => {
        // Block self-loops
        if (sourceId === targetId) {
            message.error("No se permiten bucles (self-loops).");
            return;
        }
        setEdges(prev => {
            const idx = prev.findIndex(e => e.source === sourceId && e.target === targetId);
            if (value === "") { return idx !== -1 ? prev.filter((_, i) => i !== idx) : prev; }
            let num = parseFloat(value); if (isNaN(num)) num = 0;
            if (num < 0) {
                message.error("El Algoritmo de Kruskal no permite aristas con peso negativo. Ingresa un valor ≥ 0.");
                return prev;
            }
            if (idx !== -1) { const ne = [...prev]; ne[idx] = { ...ne[idx], weight: num.toString() }; return ne; }
            const newEdge = { id: `edge-${Date.now()}-${Math.random()}`, source: sourceId, target: targetId, weight: num.toString(), isDirected: true, cpOffset: { dx: 0, dy: 0 } };
            return [...prev, newEdge];
        });
    };

    // ── Edge geometry ─────────────────────────────────────────────────
    const getEdgeGeometry = (edge: GraphEdge) => {
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) return null;
        const isSimMode = isSimActive;
        const R = isSimMode ? 35 : 25;

        if (edge.source === edge.target) {
            const lx = src.x + R + 30; const ly = src.y - R - 10;
            const path = `M ${src.x + R},${src.y} C ${src.x + R + 60},${src.y - 60} ${src.x - 20},${src.y - 60} ${src.x},${src.y - R}`;
            return { path, labelX: lx, labelY: ly, isLoop: true };
        }

        const dx = tgt.x - src.x; const dy = tgt.y - src.y;
        const angle = Math.atan2(dy, dx);
        const startX = src.x + Math.cos(angle) * R; const startY = src.y + Math.sin(angle) * R;
        const endX = tgt.x - Math.cos(angle) * R; const endY = tgt.y - Math.sin(angle) * R;
        const midX = (src.x + tgt.x) / 2; const midY = (src.y + tgt.y) / 2;
        const isBiDir = edges.some(e => e.source === tgt.id && e.target === src.id);
        const cpOff = edge.cpOffset ?? { dx: 0, dy: 0 };
        const hasUserBend = cpOff.dx !== 0 || cpOff.dy !== 0;

        let ctrlX: number; let ctrlY: number;
        if (!hasUserBend && isBiDir) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            ctrlX = midX + (-dy / dist) * 40; ctrlY = midY + (dx / dist) * 40;
        } else { ctrlX = midX + cpOff.dx; ctrlY = midY + cpOff.dy; }

        const isStraight = !hasUserBend && !isBiDir;
        const path = isStraight ? `M ${startX},${startY} L ${endX},${endY}` : `M ${startX},${startY} Q ${ctrlX},${ctrlY} ${endX},${endY}`;
        const labelX = isStraight ? midX : 0.25 * startX + 0.5 * ctrlX + 0.25 * endX;
        const labelY = isStraight ? midY - 12 : 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;
        return { path, labelX, labelY, isLoop: false };
    };

    const getEdgeColor = (edgeId: string) => {
        const inSimOrDone = simState === 'running' || simState === 'paused' || simState === 'done';
        if (!inSimOrDone) return '#2e186a';
        if (criticalEdges.has(edgeId)) return '#ef4444';
        if (activeEdge === edgeId) return '#8b5cf6';
        return '#64748b';
    };

    return (
        <Wrap>
            {/* ── Simulation Controls Bar ───────────────────────────────── */}
            <SimBar>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 800, color: '#2e186a', fontSize: '1.2rem' }}>
                        Algoritmo de Kruskal
                    </div>
                    {/* Graph validity indicator */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: graphValid ? '#f0fdf4' : '#fff7ed',
                        border: `1px solid ${graphValid ? '#86efac' : '#fed7aa'}`,
                        borderRadius: 20, padding: '3px 10px', fontSize: '0.78rem',
                        color: graphValid ? '#16a34a' : '#ea580c', fontWeight: 600,
                        whiteSpace: 'nowrap',
                    }}>
                        {graphValid ? '✅ Grafo válido' : '⚠ Grafo inválido'}
                    </div>
                </div>


                {/* Green start button — always visible */}
                <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => {
                        const err = validateGraph();
                        if (err) { Modal.error({ title: "Grafo inválido", content: err, centered: true }); return; }
                        setIsGoalModalVisible(true);
                    }}
                    disabled={simState === 'running'}
                    style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 20 }}
                >
                    Comenzar
                </Button>

                {/* Stop button — visible when running */}
                <Button
                    danger
                    icon={<PauseCircleOutlined />}
                    onClick={stopSimulation}
                    disabled={simState !== 'running'}
                    style={{ borderRadius: 20 }}
                    title="Detener"
                />

                {/* Reset — always visible */}
                <Button
                    icon={<ReloadOutlined />}
                    onClick={resetSimulation}
                    style={{ borderRadius: 20, borderColor: '#8b5cf6', color: '#8b5cf6' }}
                    title="Reiniciar"
                />

                {/* Matrix toggle */}
                <Button
                    icon={<TableOutlined />}
                    onClick={() => setShowMatrix(v => !v)}
                    style={{
                        borderRadius: 20,
                        borderColor: showMatrix ? '#2e186a' : '#c4b5fd',
                        color: showMatrix ? '#2e186a' : '#a0aec0',
                        background: showMatrix ? '#eef2ff' : 'white',
                    }}
                >
                    Matriz
                </Button>

                {/* Instructions toggle */}
                <Button
                    icon={<InfoCircleOutlined />}
                    onClick={() => setShowInstructions(v => !v)}
                    style={{
                        borderRadius: 20,
                        borderColor: showInstructions ? '#2e186a' : '#c4b5fd',
                        color: showInstructions ? '#2e186a' : '#a0aec0',
                        background: showInstructions ? '#eef2ff' : 'white',
                    }}
                >
                    Instrucciones
                </Button>

                <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />
                <SimBarLabel style={{ fontSize: '0.78rem', color: '#64748b' }}>Lento</SimBarLabel>
                <div style={{ width: 160 }}>
                    <Slider
                        min={10} max={1500} step={10}
                        value={simSpeed} onChange={setSimSpeed}
                        tooltip={{ formatter: (v) => `${1510 - (v ?? 0)}ms/paso` }}
                        trackStyle={{ background: '#2e186a' }} handleStyle={{ borderColor: '#2e186a' }}
                    />
                </div>
                <SimBarLabel style={{ fontSize: '0.78rem', color: '#64748b' }}>Rápido</SimBarLabel>

                {/* Acción Buttons */}
                <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />
                <Button size="small" icon={<DownloadOutlined />} onClick={handleExportJSON}
                    style={{ borderRadius: 12, color: '#096dd9', borderColor: '#91d5ff', background: '#e6f7ff', fontWeight: 600 }}>Exportar</Button>
                <Button size="small" icon={<UploadOutlined />} onClick={() => importRef.current?.click()}
                    style={{ borderRadius: 12, color: '#389e0d', borderColor: '#b7eb8f', background: '#f6ffed', fontWeight: 600 }}
                    title="Importar">Importar</Button>
                <input
                    ref={importRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportJSON}
                />
                <Button size="small" icon={<DeleteOutlined />} onClick={handleClearAll}
                    style={{ borderRadius: 12, color: '#cf1322', borderColor: '#ffa39e', background: '#fff1f0', fontWeight: 600 }}>Borrar Todo</Button>

                {/* Save/Load — only if logged in */}
                {user && (
                    <>
                        <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />
                        <Button size="small" icon={<SaveOutlined />} onClick={() => setIsSaveModalVisible(true)}
                            style={{ borderRadius: 12, color: '#2e186a', borderColor: '#c4b5fd' }}>Guardar</Button>
                        <Button size="small" icon={<FolderOpenOutlined />} onClick={openLoadModal}
                            style={{ borderRadius: 12, color: '#2e186a', borderColor: '#c4b5fd' }}>Cargar</Button>
                    </>
                )}
            </SimBar>


            {/* ── Editor + Matrix ───────────────────────────────────────── */}
            <EditorWrap>
                {/* Left sidebar — Instructions, toggleable & resizable */}
                {showInstructions && (
                    <>
                        <LeftSidebar w={leftWidth}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <strong style={{ color: '#2e186a', fontSize: '0.9rem' }}><InfoCircleOutlined /> Instrucciones</strong>
                            </div>
                            <p style={{ fontWeight: 700, color: '#1e293b', margin: '0.5rem 0 0.25rem', fontSize: '0.9rem' }}>Modo Creación</p>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#334155', lineHeight: '1.7' }}>
                                <li><b>Crear Nodo:</b> Clic en espacio vacío del lienzo.</li>
                                <li><b>Conectar Nodos:</b> Clic en un nodo para seleccionarlo, luego clic en otro nodo.</li>
                                <li><b>Matriz:</b> Edita los valores directamente para crear/eliminar aristas.</li>
                                <li style={{ color: '#ea580c' }}><b>⚠ No se permiten</b> bucles, ciclos ni pesos negativos.</li>
                            </ul>
                            <p style={{ fontWeight: 700, color: '#1e293b', margin: '0.75rem 0 0.25rem', fontSize: '0.9rem' }}>Modo Edición</p>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#334155', lineHeight: '1.7' }}>
                                <li><b>Mover Nodos:</b> Arrastra un nodo a otra posición.</li>
                                <li><b>Ajustar Curvatura:</b> Arrastra el peso de una arista.</li>
                                <li><b>Editar / Eliminar:</b> Mantén presionado un nodo o arista.</li>
                            </ul>
                            <p style={{ fontWeight: 700, color: '#1e293b', margin: '0.75rem 0 0.25rem', fontSize: '0.9rem' }}>Simulación de Kruskal</p>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#334155', lineHeight: '1.7' }}>
                                <li>El grafo puede ser dirigido o no dirigido, Kruskal lo tratará como <b>no dirigido</b>.</li>
                                <li>Elige <b>Min</b> o <b>Max</b> para buscar el Árbol de Expansión Mínima o Máxima.</li>
                                <li>Aristas en <b style={{ color: '#ef4444' }}>rojo</b> = parte del Árbol de Expansión.</li>
                            </ul>
                        </LeftSidebar>
                        {/* Drag handle between instructions and canvas */}
                        <ResizeHandle
                            axis="h"
                            onMouseDown={e => startResize('left', e)}
                            title="Arrastra para redimensionar"
                        />
                    </>
                )}

                {/* Canvas */}
                <CanvasOuter>
                    <CanvasSVG
                        ref={canvasRef}
                        mode={mode}
                        showGrid={showGrid}
                        onPointerDown={handleCanvasPointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        {/* Floating panel */}
                        <FloatingPanel visible={showPanel}>
                            <span style={{ fontSize: '0.82rem', color: '#4a5568', fontWeight: 500 }}>Modo:</span>
                            <Switch size="small"
                                checkedChildren="Edición" unCheckedChildren="Creación"
                                checked={mode === 'editing'}
                                onChange={c => setMode(c ? 'editing' : 'creation')}
                                disabled={isSimActive}
                            />
                            <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.1)' }} />
                            <Button size="small" icon={<SettingOutlined />} type="text" onClick={() => setIsSettingsOpen(true)} style={{ color: '#2e186a' }} />
                            <Button size="small" icon={<TableOutlined />} type="text"
                                onClick={() => setShowMatrix(v => !v)}
                                style={{ color: showMatrix ? '#2e186a' : '#a0aec0' }} />
                        </FloatingPanel>
                        <PanelToggle onClick={() => setShowPanel(v => !v)} title="Controles">
                            <ControlOutlined />
                        </PanelToggle>

                        {/* SVG edges */}
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            <defs>
                                {edges.map(e => (
                                    <marker key={e.id} id={`arrow-${e.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill={getEdgeColor(e.id)} />
                                    </marker>
                                ))}
                            </defs>
                            {edges.map(edge => {
                                const geom = getEdgeGeometry(edge);
                                if (!geom) return null;
                                return (
                                    <path key={edge.id} d={geom.path}
                                        stroke={getEdgeColor(edge.id)}
                                        strokeWidth={criticalEdges.has(edge.id) ? 3.5 : 2.5}
                                        fill="none"
                                        strokeDasharray={activeEdge === edge.id ? '6 3' : 'none'}
                                        markerEnd={undefined}
                                        style={{ transition: 'stroke 0.5s, stroke-width 0.3s' }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Edge labels */}
                        {edges.map(edge => {
                            const geom = getEdgeGeometry(edge);
                            if (!geom) return null;
                            
                            const isCrit = criticalEdges.has(edge.id);
                            return (
                                <EdgeLabelEl key={`label-${edge.id}`} x={geom.labelX} y={geom.labelY} mode={mode}
                                    onContextMenu={e => handleEdgeContextMenu(e, edge.id)}
                                    onPointerDown={e => handleEdgeLabelPointerDown(e, edge.id)}
                                    onPointerMove={e => handleEdgeLabelPointerMove(e, edge.id)}
                                    onPointerUp={handleEdgeLabelPointerUp}
                                    translate="no"
                                    style={{
                                        cursor: mode === 'editing' ? (draggingEdge === edge.id ? 'grabbing' : 'grab') : 'default',
                                        borderColor: isCrit ? '#ef4444' : '#c4b5fd',
                                        color: isCrit ? '#ef4444' : '#2e186a',
                                    }}>
                                    {edge.weight}
                                    
                                </EdgeLabelEl>
                            );
                        })}

                        {/* Nodes */}
                        {nodes.map(node => {
                            const d = distances[node.id];
                            
                            const isCrit = criticalNodes.has(node.id) && simState === 'done';
                            const isAct = activeNode === node.id;

                            if (simState === 'running' || simState === 'paused' || simState === 'done') {
                                return (
                                    <KruskalNode key={node.id} color={node.color}
                                        isSelected={selectedNode === node.id}
                                        isCritical={isCrit} isActive={isAct}
                                        style={{ left: node.x, top: node.y }}
                                        onPointerDown={e => handleNodePointerDown(e, node.id)}
                                        onPointerMove={handleNodePointerMove}
                                        onPointerUp={handleNodePointerUp}
                                        onPointerLeave={handleNodePointerUp}
                                        onClick={e => handleNodeClick(e, node.id)}
                                        onContextMenu={e => handleNodeContextMenu(e, node.id)}
                                        translate="no"
                                    >
                                        <DLabel color={node.color} translate="no">{node.label}</DLabel>
                                        
                                            
                                            <DDist hasValue={d !== undefined && d !== Infinity} translate="no">{d !== undefined && d !== Infinity ? d : "∞"}</DDist>
                                        
                                    </KruskalNode>
                                );
                            }

                            return (
                                <NodeCircle key={node.id} color={node.color}
                                    isSelected={selectedNode === node.id}
                                    style={{ left: node.x, top: node.y }}
                                    onPointerDown={e => handleNodePointerDown(e, node.id)}
                                    onPointerMove={handleNodePointerMove}
                                    onPointerUp={handleNodePointerUp}
                                    onPointerLeave={handleNodePointerUp}
                                    onClick={e => handleNodeClick(e, node.id)}
                                    onContextMenu={e => handleNodeContextMenu(e, node.id)}
                                    translate="no"
                                >
                                    {node.label}
                                </NodeCircle>
                            );
                        })}
                    </CanvasSVG>

                    {/* Kruskal Legend while sim running/done */}
                    {(isSimActive || simState === 'done') && (
                        <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 16, fontSize: '0.75rem' }}>
                            <span style={{ color: '#8b5cf6', fontWeight: 600 }}>┅ Arista evaluada</span>
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>━ Arista en el árbol de expansión</span>
                        </div>
                    )}
                </CanvasOuter>

                {/* Removed Matrix */}
            </EditorWrap>

            {/* ── Critical Path Summary ─────────────────────────────────── */}
                        {simState === 'done' && (
                <SummaryPanel>
                    <div style={{ fontWeight: 700, color: '#2e186a', marginBottom: 12, fontSize: '1rem' }}>
                        🌲 Árbol de Expansión {optimizationGoal === 'min' ? 'Mínima' : 'Máxima'}
                        <span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#64748b', marginLeft: 8 }}>
                            Peso total: <b style={{ color: '#ef4444' }}>{(distances as any).__total__ ?? '?'}</b>
                        </span>
                        {criticalPath.length > 1 && (
                            <span style={{ marginLeft: 12, fontSize: '0.78rem', background: '#fef3c7', color: '#92400e', borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
                                {criticalPath.length} soluciones equivalentes
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {criticalPath.map((edgeLabels, pIdx) => (
                            <div key={pIdx} style={{ background: pIdx === 0 ? '#f0fdf4' : '#f8fafc', borderRadius: 12, padding: '10px 14px', border: `1.5px solid ${pIdx === 0 ? '#86efac' : '#e2e8f0'}` }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: pIdx === 0 ? '#16a34a' : '#64748b', marginBottom: 6 }}>
                                    {pIdx === 0 ? '★ Solución principal' : `Solución alternativa ${pIdx + 1}`}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    {edgeLabels.map((lbl, i) => (
                                        <React.Fragment key={i}>
                                            <span style={{
                                                background: pIdx === 0 ? '#dcfce7' : '#f1f5f9',
                                                color: pIdx === 0 ? '#15803d' : '#334155',
                                                border: `1.5px solid ${pIdx === 0 ? '#86efac' : '#cbd5e1'}`,
                                                borderRadius: 8, padding: '3px 10px', fontWeight: 600, fontSize: '0.85rem'
                                            }}>
                                                {lbl}
                                            </span>
                                            {i < edgeLabels.length - 1 && <span style={{ color: '#94a3b8', fontWeight: 700 }}>+</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#64748b' }}>
                        Las aristas en <b style={{ color: '#ef4444' }}>rojo</b> en el grafo forman el árbol de expansión {optimizationGoal === 'min' ? 'mínima' : 'máxima'}.
                        {criticalPath.length > 1 && ' Se muestran todas las soluciones con el mismo peso total óptimo.'}
                    </div>
                </SummaryPanel>
            )}

            {/* ── Context Menu ──────────────────────────────────────────── */}
            {contextMenu.visible && (
                <ContextMenuEl x={contextMenu.x} y={contextMenu.y} onClick={e => e.stopPropagation()}>
                    <ContextMenuItemEl onClick={openEditModal}>
                        <EditOutlined style={{ color: '#2e186a' }} />
                        {contextMenu.type === 'node' ? 'Editar Nodo' : 'Editar Peso'}
                    </ContextMenuItemEl>
                    <ContextMenuItemEl onClick={handleDelete} style={{ color: '#f5222d' }}>
                        <DeleteOutlined /> {contextMenu.type === 'node' ? 'Eliminar Nodo' : 'Eliminar Arista'}
                    </ContextMenuItemEl>
                </ContextMenuEl>
            )}

            {/* ── Edge Creation Modal ───────────────────────────────────── */}
            <Modal title={<ModalTitle title="Crear Arista" />} open={isEdgeModalVisible}
                onOk={handleCreateEdge} onCancel={() => { setIsEdgeModalVisible(false); setPendingConnection(null); setSelectedNode(null); }}
                centered closeIcon={null}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <Button shape="round" onClick={() => { setIsEdgeModalVisible(false); setPendingConnection(null); setSelectedNode(null); }}>Cancelar</Button>
                        <Button shape="round" type="primary" onClick={handleCreateEdge} style={{ background: '#2e186a', borderColor: '#2e186a' }}>Guardar</Button>
                    </div>
                }>
                <div style={{ padding: '0.5rem 0' }}>
                    <label style={{ color: '#4a5568' }}>Peso de la arista (duración):</label>
                    <InputNumber value={edgeWeight} onChange={(v) => { setEdgeWeight(v); setEdgeWeightError(false); }} onPressEnter={handleCreateEdge}
                        autoFocus style={{ width: '100%', marginTop: 8 }} placeholder="Ej. 5" status={edgeWeightError ? "error" : ""} />
                    
                </div>
            </Modal>

            {/* ── Edit Node Modal ───────────────────────────────────────── */}
            <Modal title={<ModalTitle title="Editar Nodo" />} open={isEditNodeModalVisible}
                onOk={() => { setNodes(ns => ns.map(n => n.id === contextMenu.id ? { ...n, label: editNodeData.name, color: editNodeData.color } : n)); setIsEditNodeModalVisible(false); }}
                onCancel={() => setIsEditNodeModalVisible(false)} centered closeIcon={null}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0.5rem 0' }}>
                    <label style={{ color: '#4a5568' }}>Nombre del nodo:</label>
                    <Input value={editNodeData.name} onChange={e => setEditNodeData(d => ({ ...d, name: e.target.value }))} />
                    <label style={{ color: '#4a5568' }}>Color:</label>
                    <input type="color" value={editNodeData.color}
                        onChange={e => setEditNodeData(d => ({ ...d, color: e.target.value }))}
                        style={{ width: 60, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                </div>
            </Modal>

            {/* ── Edit Edge Weight Modal ────────────────────────────────── */}
            <Modal title={<ModalTitle title="Editar Peso" />} open={isEditEdgeModalVisible}
                onOk={handleEditEdge}
                onCancel={() => { setIsEditEdgeModalVisible(false); setEditEdgeWeightError(false); }} centered closeIcon={null}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <Button shape="round" onClick={() => { setIsEditEdgeModalVisible(false); setEditEdgeWeightError(false); }}>Cancelar</Button>
                        <Button shape="round" type="primary" onClick={handleEditEdge} style={{ background: '#2e186a', borderColor: '#2e186a' }}>Guardar</Button>
                    </div>
                }>
                <div style={{ padding: '0.5rem 0' }}>
                    <label style={{ color: '#4a5568' }}>Nuevo peso:</label>
                    <InputNumber value={editEdgeWeight} onChange={(v) => { setEditEdgeWeight(v); setEditEdgeWeightError(false); }} onPressEnter={handleEditEdge}
                        style={{ width: '100%', marginTop: 8 }} autoFocus status={editEdgeWeightError ? "error" : ""} />
                    
                </div>
            </Modal>

            {/* ── Settings Modal ────────────────────────────────────────── */}
            <Modal title={<ModalTitle title="Configuración" />} open={isSettingsOpen}
                onCancel={() => setIsSettingsOpen(false)} footer={null} centered closeIcon={null}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0.5rem 0' }}>
                    {[
                        { label: 'Mostrar Cuadrícula', val: showGrid, set: setShowGrid },
                        { label: 'Mostrar Instrucciones', val: showInstructions, set: setShowInstructions },
                        { label: 'Editar Matriz Directamente', val: editableMatrix, set: setEditableMatrix },
                    ].map(({ label, val, set }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#4a5568', fontWeight: 500 }}>{label}</span>
                            <Switch checked={val} onChange={set} />
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#4a5568', fontWeight: 500 }}>Etiquetas</span>
                        <Switch checkedChildren="Letras" unCheckedChildren="Números"
                            checked={labelMode === 'letters'} onChange={c => setLabelMode(c ? 'letters' : 'numbers')} />
                    </div>
                    {/* JSON Export / Import — only for guests */}
                    {!user && (
                        <>
                            <div style={{ borderTop: '1px solid #eee', margin: '0.5rem 0' }} />
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button block icon={<DownloadOutlined />} onClick={handleExportJSON}>
                                    Exportar JSON
                                </Button>
                                <Button block icon={<UploadOutlined />} onClick={() => importRef.current?.click()}>
                                    Importar JSON
                                </Button>
                            </div>
                        </>
                    )}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 12, display: 'flex', justifyContent: 'center', gap: 12 }}>
                        <Button danger shape="round" onClick={() => { setNodes([]); setEdges([]); resetSimulation(); setIsSettingsOpen(false); message.success("Lienzo borrado"); }}>
                            Borrar Todo
                        </Button>
                        <Button shape="round" type="primary" onClick={() => setIsSettingsOpen(false)} style={{ background: '#2e186a', borderColor: '#2e186a' }}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            </Modal>


            {/* ── Save Canvas Modal ─────────────────────────────────────── */}
            <Modal
                title={<ModalTitle title="💾 Guardar Pizarra" />}
                open={isSaveModalVisible}
                onOk={saveCanvas}
                onCancel={() => setIsSaveModalVisible(false)}
                centered closeIcon={null}
                confirmLoading={savingCanvas}
                okText="Guardar" cancelText="Cancelar"
            >
                <div style={{ padding: '0.5rem 0' }}>
                    <label style={{ color: '#4a5568' }}>Nombre de la pizarra:</label>
                    <Input
                        value={canvasName} onChange={e => setCanvasName(e.target.value)}
                        onPressEnter={saveCanvas} autoFocus
                        placeholder="Ej. Proyecto de construcción"
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Modal>

            {/* ── Load Canvas Modal ─────────────────────────────────────── */}
            <Modal
                title={<ModalTitle title="📂 Cargar Pizarra" />}
                open={isLoadModalVisible}
                onCancel={() => setIsLoadModalVisible(false)}
                footer={null} centered closeIcon={null}
            >
                <List
                    loading={loadingCanvases}
                    dataSource={canvasList}
                    locale={{ emptyText: 'No hay pizarras guardadas' }}
                    renderItem={item => (
                        <List.Item
                            actions={[
                                <Button type="link" onClick={() => loadCanvas(item.id)}>Cargar</Button>,
                                <Button type="link" danger onClick={() => deleteCanvasEntry(item.id)}>Eliminar</Button>,
                            ]}
                        >
                            <List.Item.Meta
                                title={item.name}
                                description={new Date(item.created_at).toLocaleDateString('es')}
                            />
                        </List.Item>
                    )}
                />
            </Modal>

            {/* ── Export JSON Name Modal ────────────────────────────────── */}
            <Modal
                title={<ModalTitle title="💾 Exportar JSON" />}
                open={isExportModalVisible}
                onCancel={() => setIsExportModalVisible(false)}
                footer={null}
                centered
                closeIcon={null}
            >
                <div style={{ padding: '0.5rem 0' }}>
                    <label style={{ color: '#4a5568' }}>Nombre del archivo:</label>
                    <Input
                        value={exportFileName}
                        onChange={e => setExportFileName(e.target.value)}
                        onPressEnter={doExportJSON}
                        autoFocus
                        placeholder="Ej. mi-proyecto"
                        addonAfter=".json"
                        style={{ marginTop: 8 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem' }}>
                        <Button onClick={() => setIsExportModalVisible(false)}>Cancelar</Button>
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={doExportJSON}
                            style={{ background: '#2e186a', borderColor: '#2e186a' }}
                        >
                            Exportar
                        </Button>
                    </div>
                </div>
            </Modal>

            

            {/* ── Goal Selection Modal ────────────────────────────────────────────── */}
            <Modal
                title={<ModalTitle title="🎯 Seleccionar Objetivo" />}
                open={isGoalModalVisible}
                onCancel={() => setIsGoalModalVisible(false)}
                footer={null}
                centered
                closeIcon={null}
            >
                <div style={{ padding: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                        ¿Qué tipo de árbol de expansión deseas encontrar?
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                        <Button
                            size="large"
                            onClick={() => { setOptimizationGoal('min'); setIsGoalModalVisible(false); runSimulation('min'); }}
                            style={{
                                flex: 1, height: 80, borderRadius: 16,
                                background: 'linear-gradient(135deg,#10b981,#059669)',
                                color: 'white', fontWeight: 700, fontSize: '1rem',
                                border: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                            }}
                        >
                            <div>📉 Minimizar</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 400, opacity: 0.9 }}>Árbol de Expansión Mínima</div>
                        </Button>
                        <Button
                            size="large"
                            onClick={() => { setOptimizationGoal('max'); setIsGoalModalVisible(false); runSimulation('max'); }}
                            style={{
                                flex: 1, height: 80, borderRadius: 16,
                                background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                                color: 'white', fontWeight: 700, fontSize: '1rem',
                                border: 'none', boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
                            }}
                        >
                            <div>📈 Maximizar</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 400, opacity: 0.9 }}>Árbol de Expansión Máxima</div>
                        </Button>
                    </div>
                </div>
            </Modal>
        </Wrap >

    );
};

export default Kruskal;
