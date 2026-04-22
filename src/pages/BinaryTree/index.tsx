import { useState, useRef, useCallback } from "react";
import { message, Modal as AntModal } from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  NodeIndexOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  PageContainer,
  MainLayout,
  CanvasWrapper,
  CanvasSVG,
  RightPanel,
  Card,
  CardTitle,
  TabRow,
  Tab,
  InputRow,
  StyledInput,
  ActionButton,
  TraversalSequence,
  SeqItem,
  TraversalLegend,
  LegendItem,
  LegendDot,
  ModalOverlay,
  ModalCard,
  ModalTitle,
  FormLabel,
  NumberInput,
  EmptyState,

  PageTitle,
} from "./styles";

// ── Types ────────────────────────────────────────────────────────────────────

interface BSTNode {
  id: string;
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;
  x: number;
  y: number;
}

type TraversalType = "inorder" | "preorder" | "postorder";

// Colors
const DOT_PRE      = "#7c3aed";  // left dot   — pre-order
const DOT_IN       = "#10b981";  // top dot    — in-order
const DOT_POST     = "#f59e0b";  // right dot  — post-order
const NODE_COLOR   = "#2e186a";  // normal node
const COMPARE_COLOR = "#ef4444"; // red: node being compared on insert
const FRESH_COLOR  = "#059669";  // green: newly inserted node
const NODE_RADIUS  = 24;
const DOT_RADIUS   = 5;
// Dots float OUTSIDE the node circle (16px beyond the edge)
const DOT_OFFSET   = NODE_RADIUS + 16;

// ── BST helpers ──────────────────────────────────────────────────────────────

function makeNode(value: number): BSTNode {
  return { id: `n-${value}-${Date.now()}`, value, left: null, right: null, x: 0, y: 0 };
}

function insertBST(root: BSTNode | null, value: number): BSTNode {
  if (!root) return makeNode(value);
  if (value < root.value) return { ...root, left: insertBST(root.left, value) };
  if (value > root.value) return { ...root, right: insertBST(root.right, value) };
  return root; // duplicate — ignore
}

function buildFromArray(values: number[]): BSTNode | null {
  let root: BSTNode | null = null;
  for (const v of values) root = insertBST(root, v);
  return root;
}

/**
 * Reconstruct BST from a PRE-ORDER traversal sequence.
 * Pre-order: root is the FIRST element.
 * Elements < root go left, elements > root go right.
 */
function buildFromPreorder(values: number[]): BSTNode | null {
  if (values.length === 0) return null;
  const root = makeNode(values[0]);
  const rest = values.slice(1);
  root.left  = buildFromPreorder(rest.filter(v => v < values[0]));
  root.right = buildFromPreorder(rest.filter(v => v > values[0]));
  return root;
}

/**
 * Reconstruct BST from a POST-ORDER traversal sequence.
 * Post-order: root is the LAST element.
 * Elements < root go left, elements > root go right.
 */
function buildFromPostorder(values: number[]): BSTNode | null {
  if (values.length === 0) return null;
  const rootVal = values[values.length - 1];
  const root = makeNode(rootVal);
  const rest = values.slice(0, -1);
  root.left  = buildFromPostorder(rest.filter(v => v < rootVal));
  root.right = buildFromPostorder(rest.filter(v => v > rootVal));
  return root;
}

// ── Tree layout (in-order position → correct left/right branching) ───────────

const H_SEP = 65; // horizontal gap between in-order positions
const V_SEP = 80; // vertical gap between levels

/**
 * Assigns x based on in-order traversal index (left < root < right),
 * and y based on depth. This guarantees left subtree is always to the
 * left and right subtree is always to the right — no overlaps.
 */
function layoutTree(root: BSTNode | null, canvasW = 900, canvasH = 620): BSTNode | null {
  if (!root) return null;

  // Step 1 – assign x by in-order index
  let xIdx = 0;
  function assignX(node: BSTNode | null): void {
    if (!node) return;
    assignX(node.left);
    node.x = xIdx * H_SEP;
    xIdx++;
    assignX(node.right);
  }

  // Step 2 – assign y by depth
  function assignY(node: BSTNode | null, depth: number): void {
    if (!node) return;
    node.y = 60 + depth * V_SEP;
    assignY(node.left,  depth + 1);
    assignY(node.right, depth + 1);
  }

  assignX(root);
  assignY(root, 0);

  // Step 3 – centre the tree horizontally on the canvas
  let minX = Infinity, maxX = -Infinity;
  function bounds(node: BSTNode | null): void {
    if (!node) return;
    if (node.x < minX) minX = node.x;
    if (node.x > maxX) maxX = node.x;
    bounds(node.left);
    bounds(node.right);
  }
  bounds(root);

  const offsetX = (canvasW - (maxX - minX)) / 2 - minX;
  function shiftX(node: BSTNode | null): void {
    if (!node) return;
    node.x += offsetX;
    shiftX(node.left);
    shiftX(node.right);
  }
  shiftX(root);

  return root;
}

// ── Traversal collectors ─────────────────────────────────────────────────────

function inorder(node: BSTNode | null, out: string[]): void {
  if (!node) return;
  inorder(node.left, out);
  out.push(node.id);
  inorder(node.right, out);
}

function preorder(node: BSTNode | null, out: string[]): void {
  if (!node) return;
  out.push(node.id);
  preorder(node.left, out);
  preorder(node.right, out);
}

function postorder(node: BSTNode | null, out: string[]): void {
  if (!node) return;
  postorder(node.left, out);
  postorder(node.right, out);
  out.push(node.id);
}

function collectNodes(root: BSTNode | null): BSTNode[] {
  const result: BSTNode[] = [];
  function dfs(n: BSTNode | null) {
    if (!n) return;
    result.push(n);
    dfs(n.left);
    dfs(n.right);
  }
  dfs(root);
  return result;
}

function getNodeById(root: BSTNode | null, id: string): BSTNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  return getNodeById(root.left, id) || getNodeById(root.right, id);
}

// ── Insertion animation types ────────────────────────────────────────────────

interface InsertStep {
  nodeId: string;
  goLeft: boolean; // true = value < node → go left
}

interface InsertAnim {
  steps: InsertStep[];
  currentStep: number;
  value: number;
}

/** Trace which nodes are visited (and direction) when inserting value into tree */
function traceBSTPath(root: BSTNode | null, value: number): InsertStep[] | null {
  const steps: InsertStep[] = [];
  let curr = root;
  while (curr) {
    if (value < curr.value) {
      steps.push({ nodeId: curr.id, goLeft: true });
      curr = curr.left;
    } else if (value > curr.value) {
      steps.push({ nodeId: curr.id, goLeft: false });
      curr = curr.right;
    } else {
      return null; // duplicate
    }
  }
  return steps;
}

// ── Main Component ───────────────────────────────────────────────────────────

const CANVAS_W = 900;
const CANVAS_H = 620;

export default function BinaryTree() {
  const [root, setRoot] = useState<BSTNode | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [tab, setTab] = useState<"build" | "rebuild">("build");
  const [rebuildMode, setRebuildMode] = useState<"preorder" | "postorder">("preorder");

  // Traversal state
  const [activeTraversal, setActiveTraversal] = useState<TraversalType | null>(null);
  const [traversalSeq, setTraversalSeq] = useState<string[]>([]);
  const [traversalStep, setTraversalStep] = useState(-1);
  const animRef = useRef<NodeJS.Timeout | null>(null);

  // Insertion animation state
  const [insertAnim, setInsertAnim] = useState<InsertAnim | null>(null);
  const [freshNodeId, setFreshNodeId] = useState<string | null>(null);
  const insertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimating = insertAnim !== null;

  // Random modal
  const [randomModal, setRandomModal] = useState(false);
  const [rndNodes, setRndNodes] = useState(7);
  const [rndMin, setRndMin] = useState(1);
  const [rndMax, setRndMax] = useState(99);

  // Import ref
  const importRef = useRef<HTMLInputElement>(null);

  /** Mark a node as freshly inserted (triggers pop-in animation) */
  const markFresh = (id: string) => {
    setFreshNodeId(id);
    setTimeout(() => setFreshNodeId(null), 800);
  };

  /** Stop any running insertion animation */
  const stopInsertAnim = () => {
    if (insertTimerRef.current) clearInterval(insertTimerRef.current);
    setInsertAnim(null);
  };

  // ── Insert ───────────────────────────────────────────────────────────────

  /** Animate a single-value insertion step by step through the BST path */
  const insertOneAnimated = useCallback((value: number, currentRoot: BSTNode | null) => {
    stopInsertAnim();

    // Empty tree: insert immediately with pop
    if (!currentRoot) {
      const newR = insertBST(null, value);
      const laid = layoutTree(newR, CANVAS_W, CANVAS_H)!;
      setRoot(laid);
      const fn = collectNodes(laid).find(n => n.value === value);
      if (fn) markFresh(fn.id);
      return;
    }

    const path = traceBSTPath(currentRoot, value);
    if (path === null) {
      message.warning(`El valor ${value} ya existe en el árbol (los duplicados se ignoran)`);
      return;
    }

    setInsertAnim({ steps: path, currentStep: 0, value });
    let step = 0;
    insertTimerRef.current = setInterval(() => {
      step++;
      if (step >= path.length) {
        clearInterval(insertTimerRef.current!);
        // Commit the insertion
        setRoot(prev => {
          const newR = insertBST(prev, value);
          const laid = layoutTree(newR, CANVAS_W, CANVAS_H)!;
          const fn = collectNodes(laid).find(n => n.value === value);
          if (fn) markFresh(fn.id);
          return laid;
        });
        setInsertAnim(null);
      } else {
        setInsertAnim(prev => prev ? { ...prev, currentStep: step } : null);
      }
    }, 520);
  }, []);

  const insertValues = useCallback((raw: string, currentRoot: BSTNode | null) => {
    const nums = raw
      .split(/[\s,;]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));
    if (nums.length === 0) {
      message.warning("Ingresa al menos un número válido");
      return;
    }
    stopTraversal();
    if (nums.length === 1) {
      // Animate single insert
      insertOneAnimated(nums[0], currentRoot);
    } else {
      // Bulk insert without animation
      setRoot(prev => {
        let r = prev;
        for (const v of nums) r = insertBST(r, v);
        return layoutTree(r, CANVAS_W, CANVAS_H);
      });
    }
    setInputValue("");
  }, [insertOneAnimated]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAnimating) insertValues(inputValue, root);
  };

  // ── Rebuild / Clear ──────────────────────────────────────────────────────

  const clearTree = () => {
    stopInsertAnim();
    setRoot(null);
    stopTraversal();
  };

  const rebuildFromInput = () => {
    const nums = inputValue
      .split(/[\s,;]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));
    if (nums.length === 0) {
      message.warning("Ingresa los valores para reconstruir");
      return;
    }
    stopInsertAnim();
    const newRoot = rebuildMode === "preorder"
      ? buildFromPreorder(nums)
      : buildFromPostorder(nums);
    setRoot(layoutTree(newRoot, CANVAS_W, CANVAS_H));
    setInputValue("");
    stopTraversal();
    message.success(`Árbol reconstruido desde ${rebuildMode === "preorder" ? "Pre-Order" : "Post-Order"}`);
  };

  // ── Random generation ────────────────────────────────────────────────────

  const generateRandom = () => {
    if (rndMin >= rndMax) { message.error("El mínimo debe ser menor al máximo"); return; }
    const range = rndMax - rndMin + 1;
    if (rndNodes > range) { message.error("Rango insuficiente para la cantidad de nodos únicos"); return; }
    const pool = Array.from({ length: range }, (_, i) => i + rndMin);
    // Fisher-Yates shuffle then take rndNodes
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const selected = pool.slice(0, rndNodes);
    const newRoot = buildFromArray(selected);
    setRoot(layoutTree(newRoot, CANVAS_W, CANVAS_H));
    setRandomModal(false);
    stopTraversal();
    message.success(`Árbol generado con ${rndNodes} nodos`);
  };

  // ── Traversal animation ──────────────────────────────────────────────────

  const stopTraversal = () => {
    if (animRef.current) clearInterval(animRef.current);
    setActiveTraversal(null);
    setTraversalSeq([]);
    setTraversalStep(-1);
  };

  const startTraversal = (type: TraversalType) => {
    if (!root) { message.info("Construye un árbol primero"); return; }
    stopTraversal();
    const seq: string[] = [];
    if (type === "inorder") inorder(root, seq);
    else if (type === "preorder") preorder(root, seq);
    else postorder(root, seq);
    setActiveTraversal(type);
    setTraversalSeq(seq);
    setTraversalStep(0);
    let step = 0;
    animRef.current = setInterval(() => {
      step++;
      if (step >= seq.length) {
        clearInterval(animRef.current!);
        setTraversalStep(seq.length - 1);
        return;
      }
      setTraversalStep(step);
    }, 600);
  };

  // ── Import / Export ──────────────────────────────────────────────────────

  const exportJSON = () => {
    if (!root) { message.info("No hay árbol para exportar"); return; }
    const nodes = collectNodes(root);
    const values = [];
    // Export values in insertion order = preorder keeps BST reconstructable
    const seq: string[] = [];
    preorder(root, seq);
    for (const id of seq) {
      const n = nodes.find((x) => x.id === id);
      if (n) values.push(n.value);
    }
    const data = { version: 1, type: "bst", values };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "arbol-binario.json";
    a.click();
    URL.revokeObjectURL(url);
    message.success("Árbol exportado correctamente");
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data.values)) throw new Error("Formato inválido");
        const newRoot = buildFromArray(data.values);
        setRoot(layoutTree(newRoot, CANVAS_W, CANVAS_H));
        stopTraversal();
        message.success("Árbol importado correctamente");
      } catch {
        message.error("El archivo no es un árbol binario válido");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };



  // ── Render helpers ───────────────────────────────────────────────────────

  function renderEdges(node: BSTNode | null): React.ReactNode {
    if (!node) return null;
    return (
      <>
        {node.left && (
          <>
            <line
              x1={node.x} y1={node.y}
              x2={node.left.x} y2={node.left.y}
              stroke="#cbd5e0" strokeWidth="2"
            />
            {renderEdges(node.left)}
          </>
        )}
        {node.right && (
          <>
            <line
              x1={node.x} y1={node.y}
              x2={node.right.x} y2={node.right.y}
              stroke="#cbd5e0" strokeWidth="2"
            />
            {renderEdges(node.right)}
          </>
        )}
      </>
    );
  }

  function renderNodes(node: BSTNode | null): React.ReactNode {
    if (!node) return null;

    const visitedSet = new Set(traversalSeq.slice(0, traversalStep + 1));
    const isTraversalHighlight = traversalSeq[traversalStep] === node.id;
    const preVisited  = activeTraversal === "preorder"  && visitedSet.has(node.id);
    const inVisited   = activeTraversal === "inorder"   && visitedSet.has(node.id);
    const postVisited = activeTraversal === "postorder" && visitedSet.has(node.id);

    // Insertion animation state for this node
    const isFresh   = freshNodeId === node.id;
    const isCompare = insertAnim !== null &&
                      insertAnim.steps[insertAnim.currentStep]?.nodeId === node.id;
    const compareStep = insertAnim?.steps[insertAnim.currentStep];

    // Node fill color priority: compare > traversal > fresh > normal
    const nodeFill = isCompare
      ? COMPARE_COLOR
      : isTraversalHighlight
      ? "#7c3aed"
      : isFresh
      ? FRESH_COLOR
      : NODE_COLOR;

    const nodeFilter = isCompare
      ? "drop-shadow(0 0 10px rgba(239,68,68,0.8))"
      : isTraversalHighlight
      ? "drop-shadow(0 0 10px rgba(124,58,237,0.8))"
      : isFresh
      ? "drop-shadow(0 0 12px rgba(5,150,105,0.9))"
      : "none";

    return (
      <>
        {renderNodes(node.left)}
        {renderNodes(node.right)}

        {/* Node group — transform-origin needed for pop-in scale */}
        <g style={{
          transformOrigin: `${node.x}px ${node.y}px`,
          animation: isFresh ? "bstPopIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
        }}>
          {/* Node circle */}
          <circle
            cx={node.x} cy={node.y} r={NODE_RADIUS}
            fill={nodeFill}
            style={{ filter: nodeFilter, transition: "fill 0.25s, filter 0.25s" }}
          />

          {/* Node label */}
          <text
            x={node.x} y={node.y}
            textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="12" fontWeight="700"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {node.value}
          </text>
        </g>

        {/* Direction indicator during insertion animation */}
        {isCompare && compareStep && (
          <>
            {/* Arrow label showing comparison direction */}
            <text
              x={node.x}
              y={node.y + NODE_RADIUS + 18}
              textAnchor="middle"
              fill={COMPARE_COLOR}
              fontSize="11"
              fontWeight="700"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {compareStep.goLeft
                ? `${insertAnim!.value} < ${node.value} → izq`
                : `${insertAnim!.value} > ${node.value} → der`}
            </text>
            {/* Highlight the direction arrow on the edge */}
            {compareStep.goLeft && node.left && (
              <line
                x1={node.x} y1={node.y}
                x2={node.left.x} y2={node.left.y}
                stroke={COMPARE_COLOR} strokeWidth="3" strokeDasharray="6 3"
                style={{ transition: "stroke 0.2s" }}
              />
            )}
            {!compareStep.goLeft && node.right && (
              <line
                x1={node.x} y1={node.y}
                x2={node.right.x} y2={node.right.y}
                stroke={COMPARE_COLOR} strokeWidth="3" strokeDasharray="6 3"
                style={{ transition: "stroke 0.2s" }}
              />
            )}
          </>
        )}

        {/* Pre-order dot — LEFT of node (separated outside) */}
        <circle
          cx={node.x - DOT_OFFSET} cy={node.y}
          r={DOT_RADIUS}
          fill={DOT_PRE}
          opacity={preVisited ? 1 : 0.2}
          style={{ transition: "opacity 0.25s" }}
        />

        {/* In-order dot — TOP of node (separated outside) */}
        <circle
          cx={node.x} cy={node.y - DOT_OFFSET}
          r={DOT_RADIUS}
          fill={DOT_IN}
          opacity={inVisited ? 1 : 0.2}
          style={{ transition: "opacity 0.25s" }}
        />

        {/* Post-order dot — RIGHT of node (separated outside) */}
        <circle
          cx={node.x + DOT_OFFSET} cy={node.y}
          r={DOT_RADIUS}
          fill={DOT_POST}
          opacity={postVisited ? 1 : 0.2}
          style={{ transition: "opacity 0.25s" }}
        />
      </>
    );
  }

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <PageContainer>
      {/* Keyframe for pop-in animation of new nodes */}
      <style>{`
        @keyframes bstPopIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.35); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <PageTitle>
        <h1>🌳 Árbol Binario de Búsqueda</h1>
        <span className="subtitle">Visualizador interactivo — BST</span>
      </PageTitle>

      <MainLayout>
        {/* ── Canvas ──────────────────────────────────────────────────── */}
        <CanvasWrapper>
          <CanvasSVG viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="xMidYMid meet">
            {root ? (
              <>
                {renderEdges(root)}
                {renderNodes(root)}
              </>
            ) : (
              <foreignObject x="0" y="0" width={CANVAS_W} height={CANVAS_H}>
                <EmptyState>
                  <span style={{ fontSize: "3rem" }}>🌲</span>
                  <span>Inserta valores para construir el árbol</span>
                </EmptyState>
              </foreignObject>
            )}
          </CanvasSVG>

          {/* Traversal legend */}
          <TraversalLegend style={{ marginTop: "0.75rem" }}>
            <LegendItem><LegendDot color={DOT_PRE} /> Pre-order (izquierda)</LegendItem>
            <LegendItem><LegendDot color={DOT_IN} /> In-order (arriba)</LegendItem>
            <LegendItem><LegendDot color={DOT_POST} /> Post-order (derecha)</LegendItem>
          </TraversalLegend>
        </CanvasWrapper>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <RightPanel>

          {/* Build / Rebuild card */}
          <Card>
            <CardTitle><NodeIndexOutlined /> Constructor</CardTitle>
            <TabRow>
              <Tab active={tab === "build"} onClick={() => setTab("build")}>Construir</Tab>
              <Tab active={tab === "rebuild"} onClick={() => setTab("rebuild")}>Reconstruir</Tab>
            </TabRow>

            {tab === "build" ? (
              <>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#718096" }}>
                  Un número: inserción animada mostrando el recorrido. Varios (separados por espacio): inserción directa.
                </p>
                {isAnimating && (
                  <p style={{ margin: 0, fontSize: "0.8rem", color: COMPARE_COLOR, fontWeight: 600 }}>
                    ⏳ Insertando {insertAnim?.value}… paso {(insertAnim?.currentStep ?? 0) + 1}/{insertAnim?.steps.length}
                  </p>
                )}
                <InputRow>
                  <StyledInput
                    placeholder="Ej: 50  |  50 30 70"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isAnimating}
                  />
                  <ActionButton onClick={() => insertValues(inputValue, root)} disabled={isAnimating}>
                    Insertar
                  </ActionButton>
                </InputRow>
                <InputRow>
                  <ActionButton
                    variant="secondary"
                    style={{ flex: 1 }}
                    onClick={() => setRandomModal(true)}
                    disabled={isAnimating}
                  >
                    <ThunderboltOutlined /> Generar Aleatorio
                  </ActionButton>
                  <ActionButton variant="danger" onClick={clearTree} disabled={isAnimating}>
                    <DeleteOutlined />
                  </ActionButton>
                </InputRow>
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#718096" }}>
                  Ingresa la secuencia del recorrido para reconstruir el árbol desde cero.
                </p>

                {/* Mode selector */}
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    onClick={() => setRebuildMode("preorder")}
                    style={{
                      flex: 1, padding: "0.4rem 0", border: "none", borderRadius: 8,
                      cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
                      background: rebuildMode === "preorder" ? "#7c3aed" : "#f0f2f5",
                      color: rebuildMode === "preorder" ? "white" : "#4a5568",
                      transition: "all 0.2s",
                    }}
                  >
                    🟣 Pre-Order
                  </button>
                  <button
                    onClick={() => setRebuildMode("postorder")}
                    style={{
                      flex: 1, padding: "0.4rem 0", border: "none", borderRadius: 8,
                      cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
                      background: rebuildMode === "postorder" ? "#f59e0b" : "#f0f2f5",
                      color: rebuildMode === "postorder" ? "white" : "#4a5568",
                      transition: "all 0.2s",
                    }}
                  >
                    🟡 Post-Order
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: "0.75rem", color: "#a0aec0" }}>
                  {rebuildMode === "preorder"
                    ? "El primer valor es la raíz. Luego sus hijos izq/der."
                    : "El último valor es la raíz. Los anteriores son sus hijos."}
                </p>

                <StyledInput
                  placeholder={rebuildMode === "preorder" ? "Ej: 50 30 20 40 70" : "Ej: 20 40 30 70 50"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && rebuildFromInput()}
                />
                <InputRow>
                  <ActionButton style={{ flex: 1 }} onClick={rebuildFromInput}>
                    <ReloadOutlined /> Reconstruir
                  </ActionButton>
                  <ActionButton variant="danger" onClick={clearTree}>
                    <DeleteOutlined />
                  </ActionButton>
                </InputRow>
              </>
            )}

            {/* Import / Export */}
            <div style={{ borderTop: "1px solid #f0f2f5", paddingTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
              <ActionButton variant="secondary" style={{ flex: 1 }} onClick={exportJSON}>
                <DownloadOutlined /> Exportar
              </ActionButton>
              <ActionButton variant="secondary" style={{ flex: 1 }} onClick={() => importRef.current?.click()}>
                <UploadOutlined /> Importar
              </ActionButton>
              <input ref={importRef} type="file" accept=".json" style={{ display: "none" }} onChange={importJSON} />
            </div>
          </Card>

          {/* Traversal card */}
          <Card>
            <CardTitle>🔍 Recorridos</CardTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {/* In-Order — verde (#10b981) = punto arriba */}
              <button
                onClick={() => activeTraversal === "inorder" ? stopTraversal() : startTraversal("inorder")}
                style={{
                  width: "100%", padding: "0.5rem 1rem", border: "none", borderRadius: 10,
                  cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  background: activeTraversal === "inorder" ? "#10b981" : "rgba(16,185,129,0.1)",
                  color: activeTraversal === "inorder" ? "white" : "#10b981",
                  boxShadow: activeTraversal === "inorder" ? "0 4px 12px rgba(16,185,129,0.35)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#10b981", display: "inline-block", flexShrink: 0,
                  border: activeTraversal === "inorder" ? "2px solid white" : "none",
                }} />
                {activeTraversal === "inorder" ? "⏹ Detener In-Order" : "▶ In-Order (arriba)"}
              </button>

              {/* Pre-Order — morado (#7c3aed) = punto izquierda */}
              <button
                onClick={() => activeTraversal === "preorder" ? stopTraversal() : startTraversal("preorder")}
                style={{
                  width: "100%", padding: "0.5rem 1rem", border: "none", borderRadius: 10,
                  cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  background: activeTraversal === "preorder" ? "#7c3aed" : "rgba(124,58,237,0.1)",
                  color: activeTraversal === "preorder" ? "white" : "#7c3aed",
                  boxShadow: activeTraversal === "preorder" ? "0 4px 12px rgba(124,58,237,0.35)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#7c3aed", display: "inline-block", flexShrink: 0,
                  border: activeTraversal === "preorder" ? "2px solid white" : "none",
                }} />
                {activeTraversal === "preorder" ? "⏹ Detener Pre-Order" : "▶ Pre-Order (izquierda)"}
              </button>

              {/* Post-Order — ámbar (#f59e0b) = punto derecha */}
              <button
                onClick={() => activeTraversal === "postorder" ? stopTraversal() : startTraversal("postorder")}
                style={{
                  width: "100%", padding: "0.5rem 1rem", border: "none", borderRadius: 10,
                  cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  background: activeTraversal === "postorder" ? "#f59e0b" : "rgba(245,158,11,0.1)",
                  color: activeTraversal === "postorder" ? "white" : "#b45309",
                  boxShadow: activeTraversal === "postorder" ? "0 4px 12px rgba(245,158,11,0.35)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#f59e0b", display: "inline-block", flexShrink: 0,
                  border: activeTraversal === "postorder" ? "2px solid white" : "none",
                }} />
                {activeTraversal === "postorder" ? "⏹ Detener Post-Order" : "▶ Post-Order (derecha)"}
              </button>
            </div>

            {traversalSeq.length > 0 && (
              <>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#a0aec0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Secuencia
                </p>
                <TraversalSequence>
                  {traversalSeq.map((id, idx) => {
                    const n = getNodeById(root, id);
                    return (
                      <SeqItem key={`${id}-${idx}`} active={idx === traversalStep}>
                        {n?.value ?? "?"}
                      </SeqItem>
                    );
                  })}
                </TraversalSequence>
              </>
            )}
          </Card>


        </RightPanel>
      </MainLayout>

      {/* ── Random Modal ───────────────────────────────────────────────────── */}
      {randomModal && (
        <ModalOverlay onClick={() => setRandomModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>⚡ Generar Árbol Aleatorio</ModalTitle>

            <div>
              <FormLabel>Número de nodos</FormLabel>
              <NumberInput
                type="number" min={1} max={50}
                value={rndNodes}
                onChange={(e) => setRndNodes(Number(e.target.value))}
              />
            </div>
            <div>
              <FormLabel>Valor mínimo</FormLabel>
              <NumberInput
                type="number"
                value={rndMin}
                onChange={(e) => setRndMin(Number(e.target.value))}
              />
            </div>
            <div>
              <FormLabel>Valor máximo</FormLabel>
              <NumberInput
                type="number"
                value={rndMax}
                onChange={(e) => setRndMax(Number(e.target.value))}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <ActionButton variant="secondary" onClick={() => setRandomModal(false)}>
                Cancelar
              </ActionButton>
              <ActionButton onClick={generateRandom}>
                <ThunderboltOutlined /> Generar
              </ActionButton>
            </div>
          </ModalCard>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}
