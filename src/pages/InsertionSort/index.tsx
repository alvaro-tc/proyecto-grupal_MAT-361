import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Button, InputNumber, Slider, message, Modal } from 'antd';
import {
  PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined,
  DeleteOutlined, PlusOutlined, ExportOutlined, ImportOutlined,
} from '@ant-design/icons';

// ─── Types ────────────────────────────────────────────────────────────────────
type SortOrder = 'asc' | 'desc';
type ElementState = 'default' | 'sorted' | 'outer' | 'minFound' | 'scanning' | 'swapping';
type SimPhase = 'idle' | 'running' | 'paused' | 'done';

interface SortElement {
  value: number;
  state: ElementState;
}

// ─── Animations ──────────────────────────────────────────────────────────────
const scanPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55); }
  50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
`;

const minPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.55); }
  50% { box-shadow: 0 0 0 10px rgba(217, 119, 6, 0); }
`;

const outerPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.55); }
  50% { box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); }
`;

const swapBounce = keyframes`
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  35%  { transform: translate3d(0, -6px, 0) scale(1.08, 0.94); }
  65%  { transform: translate3d(0, 2px, 0)  scale(0.96, 1.04); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
`;

const sortedGlow = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.65); }
  60%  { box-shadow: 0 0 0 12px rgba(22, 163, 74, 0); }
  100% { box-shadow: none; }
`;

const triangleSlide = keyframes`
  0%   { transform: translateY(-6px); opacity: 0; }
  70%  { transform: translateY(2px);  opacity: 1; }
  100% { transform: translateY(0);    opacity: 1; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Styled Components ────────────────────────────────────────────────────────
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);
  padding: 1.25rem 2rem 2rem;
  gap: 1rem;
  background: #f8fafc;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(46, 24, 106, 0.08);
`;

const PageTitle = styled.h2`
  font-family: 'Motiva Sans Bold', serif;
  color: #2e186a;
  margin: 0;
  font-size: 1.6rem;
`;

const MainArea = styled.div`
  display: flex;
  gap: 1rem;
  flex: 1;
  align-items: flex-start;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const ControlPanel = styled.div`
  width: 264px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(46, 24, 106, 0.08);
`;

const CardTitle = styled.h4`
  font-family: 'Motiva Sans Bold', serif;
  color: #2e186a;
  margin: 0 0 0.9rem 0;
  font-size: 0.95rem;
`;

const FieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.65rem;
`;

const FieldLabel = styled.label`
  font-size: 0.78rem;
  color: #4a5568;
  font-weight: 500;
`;

const CenterPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
`;

const SimBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  background: white;
  padding: 0.85rem 1.25rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(46, 24, 106, 0.08);
`;

const StatsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.3s ease;
`;

const StatBadge = styled.div`
  background: white;
  border-radius: 12px;
  padding: 0.55rem 1.1rem;
  box-shadow: 0 4px 12px rgba(46, 24, 106, 0.08);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: #2e186a;
  font-family: 'Motiva Sans Bold', serif;
`;

const CanvasCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(46, 24, 106, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 300px;
`;

const BarsContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 7px;
  padding: 1.5rem 0.5rem 0;
  min-height: 140px;
  overflow: hidden;
  flex-wrap: nowrap;
`;

const BarColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
`;

interface BarRectProps {
  elementState: ElementState;
  barColor: string;
  squareSize: number;
}

const BarRect = styled.div<BarRectProps>`
  width: ${p => p.squareSize}px;
  min-width: ${p => p.squareSize}px;
  height: ${p => p.squareSize}px;
  background: ${p => p.barColor};
  border-radius: 8px;
  border: 2.5px solid ${p => {
    switch (p.elementState) {
      case 'sorted':   return '#16a34a';
      case 'outer':    return '#7c3aed';
      case 'minFound': return '#d97706';
      case 'scanning': return '#dc2626';
      case 'swapping': return '#0ea5e9';
      default:         return 'rgba(0,0,0,0.08)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Motiva Sans Bold', serif;
  font-size: ${p => p.squareSize < 36 ? '0.62rem' : p.squareSize < 52 ? '0.72rem' : '0.88rem'};
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  transition:
    width        0.28s ease,
    height       0.28s ease,
    background   0.35s ease,
    border-color 0.30s ease,
    box-shadow   0.30s ease;
  cursor: default;
  user-select: none;
  will-change: transform, box-shadow;
  transform: translate3d(0, 0, 0);

  ${p => p.elementState === 'scanning' && css`animation: ${scanPulse} 0.8s ease infinite;`}
  ${p => p.elementState === 'minFound' && css`animation: ${minPulse} 0.9s ease infinite;`}
  ${p => p.elementState === 'outer'    && css`animation: ${outerPulse} 0.9s ease infinite;`}
  ${p => p.elementState === 'swapping' && css`animation: ${swapBounce} 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97);`}
  ${p => p.elementState === 'sorted'   && css`animation: ${sortedGlow} 0.6s ease forwards;`}
`;

const TriangleUp = styled.div<{ visible: boolean; triColor: string; entering: boolean }>`
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 14px solid ${p => p.triColor};
  opacity: ${p => p.visible ? 1 : 0};
  margin-top: 5px;
  transition: opacity 0.2s ease, border-bottom-color 0.25s ease;
  will-change: transform;
  ${p => p.entering && css`animation: ${triangleSlide} 0.32s ease-out forwards;`}
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  background: white;
  padding: 0.65rem 1.25rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(46, 24, 106, 0.06);
`;

interface LegendDotProps {
  dotColor: string;
  borderColor?: string;
}

const LegendDot = styled.div<LegendDotProps>`
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: ${p => p.dotColor};
  border: 2px solid ${p => p.borderColor || p.dotColor};
  flex-shrink: 0;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const MAX_ELEMS = 20;

function calcSquareSize(
  containerWidth: number,
  count: number,
  value: number,
  minVal: number,
  maxVal: number,
): number {
  const gap = 7;
  const padding = 32;
  const available = Math.max(160, containerWidth - padding);
  const fitSize = Math.floor((available - gap * Math.max(count - 1, 0)) / Math.max(count, 1));
  const MAX_S = Math.min(110, Math.max(32, fitSize));
  const MIN_S = Math.max(24, Math.floor(MAX_S * 0.45));
  if (maxVal === minVal) return Math.round((MAX_S + MIN_S) / 2);
  const pct = (value - minVal) / (maxVal - minVal);
  return Math.round(MIN_S + pct * (MAX_S - MIN_S));
}

function calcBarColor(value: number, minVal: number, maxVal: number): string {
  const range = maxVal === minVal ? 1 : maxVal - minVal;
  const pct = (value - minVal) / range;
  const hue = Math.round(240 - pct * 200); // blue → yellow/orange
  return `hsl(${hue}, 65%, 52%)`;
}

function makeElements(values: number[]): SortElement[] {
  return values.map(v => ({ value: v, state: 'default' as ElementState }));
}

function randomArray(count: number, min: number, max: number): SortElement[] {
  return makeElements(
    Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
const InsertionSort: React.FC = () => {
  const [elements, setElements] = useState<SortElement[]>(() => randomArray(10, 1, 100));
  const [simPhase, setSimPhase] = useState<SimPhase>('idle');
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);

  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [randCount, setRandCount] = useState(10);
  const [randMin, setRandMin]     = useState(1);
  const [randMax, setRandMax]     = useState(100);
  const [manualVal, setManualVal] = useState<number | null>(null);
  const [simSpeed, setSimSpeed]   = useState(500);

  const isPausedRef      = useRef(false);
  const stopRef          = useRef(false);
  const speedRef         = useRef(500);
  const canvasRef        = useRef<HTMLDivElement>(null);
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const [containerWidth, setContainerWidth] = useState(700);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width - 48);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const allValues = elements.map(e => e.value);
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 100;

  // ── Controls ────────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    if (simPhase === 'running') return;
    if (randMin >= randMax) { message.error('El límite inferior debe ser menor que el superior'); return; }
    stopRef.current = true;
    const count = Math.min(Math.max(Math.round(randCount), 2), MAX_ELEMS);
    setElements(randomArray(count, randMin, randMax));
    setSimPhase('idle');
    setComparisons(0);
    setSwaps(0);
  }, [simPhase, randCount, randMin, randMax]);

  const handleAddManual = useCallback(() => {
    if (simPhase === 'running' || manualVal === null) return;
    if (elements.length >= MAX_ELEMS) { message.warning(`Máximo ${MAX_ELEMS} elementos`); return; }
    setElements(prev => [...prev, { value: manualVal, state: 'default' }]);
    setManualVal(null);
  }, [simPhase, manualVal, elements.length]);

  const handleDeleteLast = useCallback(() => {
    if (simPhase === 'running') return;
    stopRef.current = true;
    setElements(prev => prev.slice(0, -1));
    setSimPhase('idle');
  }, [simPhase]);

  const handleClear = useCallback(() => {
    if (simPhase === 'running') return;
    stopRef.current = true;
    setElements([]);
    setSimPhase('idle');
    setComparisons(0);
    setSwaps(0);
  }, [simPhase]);

  const handleReset = useCallback(() => {
    stopRef.current = true;
    isPausedRef.current = false;
    setSimPhase('idle');
    setComparisons(0);
    setSwaps(0);
    setElements(prev => prev.map(e => ({ ...e, state: 'default' })));
  }, []);

  const handlePause = useCallback(() => {
    isPausedRef.current = true;
    setSimPhase('paused');
  }, []);

  const handleResume = useCallback(() => {
    isPausedRef.current = false;
    setSimPhase('running');
  }, []);

  const handleSpeedChange = useCallback((val: number) => {
    setSimSpeed(val);
    speedRef.current = val;
  }, []);

  const handleExportJSON = useCallback(() => {
    const values = elements.map(e => e.value);
    const dataStr = JSON.stringify(values, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'insertion-sort-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Archivo exportado correctamente');
  }, [elements]);

  const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed)) {
          throw new Error('El archivo debe contener un arreglo de números');
        }

        const numericArray = parsed.map(v => {
          const num = Number(v);
          if (isNaN(num)) throw new Error('Todos los elementos deben ser números');
          return num;
        });

        if (numericArray.length > MAX_ELEMS) {
          message.warning(`El archivo excede el máximo de ${MAX_ELEMS} elementos. Se truncará.`);
          numericArray.splice(MAX_ELEMS);
        }

        stopRef.current = true;
        setElements(makeElements(numericArray));
        setSimPhase('idle');
        setComparisons(0);
        setSwaps(0);
        message.success('Archivo importado correctamente');
      } catch (err: any) {
        message.error(`Error al importar: ${err.message}`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }, []);

  // ── Solver ──────────────────────────────────────────────────────────────────
  const handleSolve = useCallback(async () => {
    if (elements.length < 2) { message.info('Agrega al menos 2 elementos'); return; }

    stopRef.current = false;
    isPausedRef.current = false;
    setSimPhase('running');
    setComparisons(0);
    setSwaps(0);

    const arr = elements.map(e => e.value);
    const n = arr.length;
    let comps = 0;
    let shifts = 0;
    const isAsc = sortOrder === 'asc';

    const show = (states: ElementState[]) => {
      setElements(arr.map((v, i) => ({ value: v, state: states[i] })));
    };

    // First element is already "sorted" relative to itself
    show(arr.map((_, i) => i === 0 ? 'sorted' : 'default'));
    await sleep(speedRef.current * 0.5);

    for (let i = 1; i < n; i++) {
      if (stopRef.current) break;

      let key = arr[i];
      let j = i - 1;

      // Highlight element being inserted
      show(arr.map((_, idx) => {
        if (idx < i) return 'sorted';
        if (idx === i) return 'outer';
        return 'default';
      }));
      await sleep(speedRef.current * 0.7);

      while (j >= 0) {
        while (isPausedRef.current && !stopRef.current) await sleep(50);
        if (stopRef.current) break;

        comps++;
        setComparisons(comps);

        // Scan/Compare
        show(arr.map((_, idx) => {
          if (idx === j) return 'scanning';
          if (idx === j + 1) return 'minFound';
          if (idx <= i) return 'sorted';
          return 'default';
        }));
        await sleep(speedRef.current);

        const shouldShift = isAsc ? arr[j] > key : arr[j] < key;
        if (shouldShift) {
          // Shift
          arr[j + 1] = arr[j];
          shifts++;
          setSwaps(shifts);

          show(arr.map((_, idx) => {
            if (idx === j || idx === j + 1) return 'swapping';
            if (idx <= i) return 'sorted';
            return 'default';
          }));
          await sleep(speedRef.current * 0.8);

          j = j - 1;
          arr[j + 1] = key;
        } else {
          break;
        }
      }

      if (stopRef.current) break;

      arr[j + 1] = key;
      show(arr.map((_, idx) => idx <= i ? 'sorted' : 'default'));
      await sleep(speedRef.current * 0.5);
    }

    if (!stopRef.current) {
      setElements(arr.map(v => ({ value: v, state: 'sorted' })));
      setSimPhase('done');
    }
  }, [elements, sortOrder]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const isRunning = simPhase === 'running';
  const isPaused  = simPhase === 'paused';
  const isDone    = simPhase === 'done';

  return (
    <Wrap>
      <TopBar>
        <div>
          <PageTitle>Insertion Sort</PageTitle>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
            Algoritmo de ordenamiento por inserción
          </div>
        </div>
      </TopBar>

      <MainArea>
        <ControlPanel>
          <Card>
            <CardTitle>🎲 Generación Aleatoria</CardTitle>
            <FieldRow>
              <FieldLabel>Cantidad de elementos</FieldLabel>
              <InputNumber
                min={2} max={MAX_ELEMS} value={randCount}
                onChange={v => setRandCount(v ?? 10)}
                style={{ width: '100%', borderRadius: 8 }}
                disabled={isRunning}
              />
            </FieldRow>
            <FieldRow>
              <FieldLabel>Límite inferior</FieldLabel>
              <InputNumber
                value={randMin}
                onChange={v => setRandMin(v ?? 1)}
                style={{ width: '100%', borderRadius: 8 }}
                disabled={isRunning}
              />
            </FieldRow>
            <FieldRow>
              <FieldLabel>Límite superior</FieldLabel>
              <InputNumber
                value={randMax}
                onChange={v => setRandMax(v ?? 100)}
                style={{ width: '100%', borderRadius: 8 }}
                disabled={isRunning}
              />
            </FieldRow>
            <Button
              type="primary" block onClick={handleGenerate} disabled={isRunning}
              style={{ background: '#2e186a', borderColor: '#2e186a', borderRadius: 8 }}
            >
              🎲 Generar Aleatorio
            </Button>
          </Card>

          <Card>
            <CardTitle>✏️ Entrada Manual</CardTitle>
            <FieldRow>
              <FieldLabel>Agregar número</FieldLabel>
              <div style={{ display: 'flex', gap: 6 }}>
                <InputNumber
                  value={manualVal}
                  onChange={v => setManualVal(v ?? null)}
                  onPressEnter={handleAddManual}
                  style={{ flex: 1, borderRadius: 8 }}
                  disabled={isRunning || elements.length >= MAX_ELEMS}
                  placeholder="Número"
                />
                <Button
                  icon={<PlusOutlined />} onClick={handleAddManual}
                  disabled={manualVal === null || isRunning || elements.length >= MAX_ELEMS}
                  style={{ borderRadius: 8 }}
                />
              </div>
            </FieldRow>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                icon={<DeleteOutlined />} onClick={handleDeleteLast}
                disabled={isRunning || elements.length === 0}
                style={{ flex: 1, borderRadius: 8, fontSize: '0.8rem' }}
              >
                Borrar último
              </Button>
              <Button
                danger icon={<DeleteOutlined />} onClick={handleClear}
                disabled={isRunning || elements.length === 0}
                style={{ flex: 1, borderRadius: 8, fontSize: '0.8rem' }}
              >
                Limpiar
              </Button>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#9ca3af', textAlign: 'right' }}>
              {elements.length} / {MAX_ELEMS} elementos
            </div>
          </Card>

          <Card style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe' }}>
            <CardTitle style={{ color: '#5b21b6' }}>ℹ️ Cómo funciona</CardTitle>
            <p style={{ fontSize: '0.8rem', color: '#5b21b6', margin: 0, lineHeight: 1.65 }}>
              Insertion Sort construye una lista ordenada un elemento a la vez. Toma un elemento
              (<strong>Key</strong>) y lo desplaza hacia la izquierda hasta encontrar su posición
              correcta entre los ya ordenados.
            </p>
            <p style={{ fontSize: '0.78rem', color: '#7c3aed', margin: '0.75rem 0 0' }}>
              <strong>Complejidad:</strong> O(n²) tiempo · O(1) espacio
            </p>
          </Card>
        </ControlPanel>

        <CenterPanel>
          <SimBar>
            {(simPhase === 'idle' || isDone) && (
              <Button
                type="primary" icon={<PlayCircleOutlined />}
                onClick={() => setShowOrderModal(true)} disabled={elements.length < 2}
                style={{ background: '#2e186a', borderColor: '#2e186a', borderRadius: 8 }}
              >
                {isDone ? 'Resolver de nuevo' : 'Resolver'}
              </Button>
            )}
            {isRunning && (
              <Button
                icon={<PauseCircleOutlined />} onClick={handlePause}
                style={{ borderRadius: 8 }}
              >
                Pausar
              </Button>
            )}
            {isPaused && (
              <Button
                type="primary" icon={<PlayCircleOutlined />} onClick={handleResume}
                style={{ background: '#2e186a', borderColor: '#2e186a', borderRadius: 8 }}
              >
                Continuar
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />} onClick={handleReset} disabled={isRunning}
              style={{ borderRadius: 8 }}
            >
              Reiniciar
            </Button>
            <Button
              icon={<ExportOutlined />} onClick={handleExportJSON}
              style={{ borderRadius: 8 }}
            >
              Exportar JSON
            </Button>
            <Button
              icon={<ImportOutlined />} onClick={() => fileInputRef.current?.click()}
              disabled={isRunning}
              style={{ borderRadius: 8 }}
            >
              Importar JSON
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleImportJSON}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.82rem', color: '#4a5568', whiteSpace: 'nowrap' }}>
                Velocidad:
              </span>
              <Slider
                min={100} max={1500} value={simSpeed}
                onChange={handleSpeedChange}
                reverse
                style={{ width: 130 }}
                tooltip={{ formatter: v => `${v}ms` }}
              />
            </div>
          </SimBar>

          {(isRunning || isPaused || isDone) && (
            <StatsRow>
              <StatBadge>
                🔍 Comparaciones: <strong style={{ marginLeft: 4 }}>{comparisons}</strong>
              </StatBadge>
              <StatBadge style={{ color: '#16a34a' }}>
                🔄 Desplazamientos: <strong style={{ marginLeft: 4 }}>{swaps}</strong>
              </StatBadge>
              {isDone && (
                <StatBadge style={{ color: '#16a34a' }}>
                  ✅ ¡Ordenado {sortOrder === 'asc' ? 'ascendente' : 'descendente'}!
                </StatBadge>
              )}
            </StatsRow>
          )}

          <CanvasCard ref={canvasRef}>
            <div style={{
              fontFamily: "'Motiva Sans Bold', serif",
              color: '#2e186a',
              marginBottom: '0.5rem',
              fontSize: '0.95rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>Pizarra de Visualización</span>
              {isDone && (
                <span style={{ fontSize: '0.82rem', color: '#16a34a' }}>
                  ✅ Ordenamiento completado
                </span>
              )}
              {(isRunning || isPaused) && (
                <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontFamily: "'Motiva Sans Light', serif" }}>
                  {isPaused ? '⏸ Pausado' : '▶ Ejecutando…'}
                </span>
              )}
            </div>

            {elements.length === 0 ? (
              <div style={{
                color: '#9ca3af',
                textAlign: 'center',
                padding: '4rem 1rem',
                fontFamily: "'Motiva Sans Light', serif",
                fontSize: '0.95rem',
              }}>
                Genera elementos aleatorios o agrégalos manualmente para comenzar
              </div>
            ) : (
              <BarsContainer>
                {elements.map((el, i) => {
                  const size  = calcSquareSize(containerWidth, elements.length, el.value, minVal, maxVal);
                  const color = el.state === 'sorted'   ? '#16a34a'
                              : el.state === 'swapping' ? '#0ea5e9'
                              : calcBarColor(el.value, minVal, maxVal);

                  const showTriangle = el.state === 'scanning' || el.state === 'minFound' || el.state === 'outer';
                  const triColor     = el.state === 'outer'    ? '#7c3aed'
                                     : el.state === 'minFound' ? '#d97706'
                                     : '#dc2626';

                  return (
                    <BarColumn key={`pos-${i}`}>
                      <BarRect
                        elementState={el.state}
                        barColor={color}
                        squareSize={size}
                      >
                        {el.value}
                      </BarRect>
                      <TriangleUp
                        visible={showTriangle}
                        triColor={showTriangle ? triColor : '#dc2626'}
                        entering={showTriangle}
                      />
                    </BarColumn>
                  );
                })}
              </BarsContainer>
            )}
          </CanvasCard>

          <LegendRow>
            <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>Leyenda:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#4a5568' }}>
              <LegendDot dotColor="hsl(200, 65%, 52%)" />
              Sin ordenar
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#4a5568' }}>
              <LegendDot dotColor="hsl(200, 65%, 52%)" borderColor="#7c3aed" />
              Elemento a insertar
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#4a5568' }}>
              <LegendDot dotColor="hsl(200, 65%, 52%)" borderColor="#d97706" />
              Posición de Key
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#4a5568' }}>
              <LegendDot dotColor="hsl(200, 65%, 52%)" borderColor="#dc2626" />
              Comparando ▲
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#4a5568' }}>
              <LegendDot dotColor="#0ea5e9" />
              Desplazando
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#4a5568' }}>
              <LegendDot dotColor="#16a34a" />
              Ordenado ✓
            </div>
          </LegendRow>
        </CenterPanel>
      </MainArea>

      <Modal
        open={showOrderModal}
        title={
          <span style={{ fontFamily: "'Motiva Sans Bold', serif", color: '#2e186a', fontSize: '1.1rem' }}>
            ¿Cómo deseas ordenar?
          </span>
        }
        onCancel={() => setShowOrderModal(false)}
        footer={null}
        centered
        width={420}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.75rem 0 0.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {(['asc', 'desc'] as SortOrder[]).map(order => (
              <div
                key={order}
                onClick={() => setSortOrder(order)}
                style={{
                  flex: 1,
                  border: `2px solid ${sortOrder === order ? '#2e186a' : '#e2e8f0'}`,
                  borderRadius: 12,
                  padding: '1.25rem 1rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: sortOrder === order ? '#f5f3ff' : 'white',
                  transition: 'all 0.2s',
                  boxShadow: sortOrder === order ? '0 4px 12px rgba(46,24,106,0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: '2.2rem' }}>{order === 'asc' ? '⬆️' : '⬇️'}</div>
                <div style={{ fontFamily: "'Motiva Sans Bold', serif", color: '#2e186a', marginTop: 8, fontSize: '0.95rem' }}>
                  {order === 'asc' ? 'Ascendente' : 'Descendente'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3 }}>
                  {order === 'asc' ? 'menor → mayor' : 'mayor → menor'}
                </div>
              </div>
            ))}
          </div>
          <Button
            type="primary" size="large" icon={<PlayCircleOutlined />}
            onClick={() => { setShowOrderModal(false); handleSolve(); }}
            style={{ background: '#2e186a', borderColor: '#2e186a', borderRadius: 8 }}
          >
            Comenzar
          </Button>
        </div>
      </Modal>
    </Wrap>
  );
};

export default InsertionSort;
