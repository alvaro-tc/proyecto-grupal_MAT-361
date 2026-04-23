import React, { useState, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Button, InputNumber, Slider, message } from 'antd';
import {
  PlayCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';

// ─── Types ─────────────────────────────────────
type ElementState = 'default' | 'sorted' | 'dividing' | 'merging';
type SimPhase = 'idle' | 'running' | 'done';

interface SortElement {
  value: number;
  state: ElementState;
}

// ─── Animations ────────────────────────────────
const pulse = keyframes`
  0%,100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`;

const moveUp = keyframes`
  from { transform: translateY(10px); opacity: 0.7; }
  to { transform: translateY(0); opacity: 1; }
`;

// ─── Styled ───────────────────────────────────
const Wrap = styled.div`
  padding: 1.5rem;
  background: #f8fafc;
`;

const Top = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Card = styled.div`
  margin-top: 10px;
  background: white;
  padding: 12px;
  border-radius: 10px;
`;

const BarsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
`;

// ─── Square (CON ANIMACIÓN REAL) ─────────────
const Square = styled.div<{ state: ElementState; size: number }>`
  width: ${p => p.size}px;
  height: ${p => p.size}px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 10px;
  font-weight: bold;
  transition: all 0.3s ease;
  animation: ${moveUp} 0.3s ease;

  background: ${p =>
    p.state === 'sorted' ? '#16a34a' :
    p.state === 'dividing' ? '#7c3aed' :
    p.state === 'merging' ? '#f59e0b' :
    '#3b82f6'};

  ${p => (p.state === 'dividing' || p.state === 'merging') && css`
    animation: ${pulse} 0.5s ease;
  `}
`;

const Stats = styled.div`
  margin-top: 15px;
  display: flex;
  gap: 15px;
  font-weight: bold;
  color: #2e186a;
`;

// ─── Helpers ──────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const makeElements = (arr: number[]): SortElement[] =>
  arr.map(v => ({ value: v, state: 'default' }));

// ─── Component ────────────────────────────────
const MergeSort: React.FC = () => {
  const [elements, setElements] = useState<SortElement[]>(
    makeElements([5, 3, 8, 2, 1])
  );

  const [speed, setSpeed] = useState(500);
  const [input, setInput] = useState<number | null>(null);
  const [comparisons, setComparisons] = useState(0);
  const [moves, setMoves] = useState(0);

  const [pointers, setPointers] = useState<{
    i: number | null;
    j: number | null;
    k: number | null;
  }>({ i: null, j: null, k: null });

  const fileRef = useRef<HTMLInputElement>(null);

  // ─── IMPORT / EXPORT ─────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setElements(makeElements(data));
        setComparisons(0);
        setMoves(0);
      } catch {
        message.error('JSON inválido');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const data = elements.map(e => e.value);
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'merge.json';
    a.click();
  };

  // ─── RANDOM ─────────────────────────────────
  const handleRandom = () => {
    const arr = Array.from({ length: 10 }, () =>
      Math.floor(Math.random() * 100) + 1
    );
    setElements(makeElements(arr));
    setComparisons(0);
    setMoves(0);
  };

  // ─── SIZE ────────────────────────────────────
  const values = elements.map(e => e.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const getSize = (v: number) => {
    if (maxVal === minVal) return 50;
    return 30 + ((v - minVal) / (maxVal - minVal)) * 60;
  };

  // ─── MERGE SORT ─────────────────────────────
  const handleSolve = useCallback(async () => {
    let arr = elements.map(e => e.value);

    const merge = async (l: number, m: number, r: number) => {
      let left = arr.slice(l, m + 1);
      let right = arr.slice(m + 1, r + 1);

      let i = 0, j = 0, k = l;

      while (i < left.length && j < right.length) {
        setComparisons(c => c + 1);
        setPointers({ i: l + i, j: m + 1 + j, k });

        setElements(arr.map((v, idx) => ({
          value: v,
          state: idx >= l && idx <= r ? 'merging' : 'default'
        })));

        await sleep(speed);

        if (left[i] <= right[j]) arr[k++] = left[i++];
        else arr[k++] = right[j++];

        setMoves(m => m + 1);
      }

      while (i < left.length) {
        setPointers({ i: l + i, j: null, k });
        arr[k++] = left[i++];
        setMoves(m => m + 1);
        await sleep(speed);
      }

      while (j < right.length) {
        setPointers({ i: null, j: m + 1 + j, k });
        arr[k++] = right[j++];
        setMoves(m => m + 1);
        await sleep(speed);
      }
    };

    const mergeSort = async (l: number, r: number) => {
      if (l >= r) return;

      const m = Math.floor((l + r) / 2);

      setElements(arr.map((v, idx) => ({
        value: v,
        state: idx >= l && idx <= r ? 'dividing' : 'default'
      })));

      await sleep(speed);

      await mergeSort(l, m);
      await mergeSort(m + 1, r);
      await merge(l, m, r);
    };

    await mergeSort(0, arr.length - 1);

    setElements(arr.map(v => ({ value: v, state: 'sorted' })));
    setPointers({ i: null, j: null, k: null });

  }, [elements, speed]);

  // ─── CONTROLES ─────────────────────────────
  const handleAdd = () => {
    if (input === null) return;
    setElements(prev => [...prev, { value: input, state: 'default' }]);
    setInput(null);
  };

  const handleClear = () => setElements([]);

  // ─── UI ─────────────────────────────────────
  return (
    <Wrap>
      <h2>Merge Sort</h2>

      {/* INSTRUCCIONES */}
      <Card>
        <b>📌 Instrucciones</b>
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          👉 Agrega números o usa Aleatorio<br />
          👉 Ejecutar inicia el algoritmo<br />
          👉 Velocidad controla animación<br />
          👉 Importar / Exportar maneja JSON<br />
          👉 Punteros ⬇ muestran i, j, k en tiempo real
        </p>
      </Card>

      <Top>
        <InputNumber value={input} onChange={setInput} />
        <Button icon={<PlusOutlined />} onClick={handleAdd}>Agregar</Button>
        <Button onClick={handleRandom}>Aleatorio</Button>
        <Button icon={<DeleteOutlined />} onClick={handleClear}>Limpiar</Button>
      </Top>

      <Top style={{ marginTop: 10 }}>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleSolve}>
          Ejecutar
        </Button>

        <Button icon={<ExportOutlined />} onClick={handleExport}>Exportar</Button>
        <Button icon={<ImportOutlined />} onClick={() => fileRef.current?.click()}>
          Importar
        </Button>

        <input type="file" ref={fileRef} hidden onChange={handleImport} />
      </Top>

      <div style={{ marginTop: 10 }}>
        Velocidad:
        <Slider min={100} max={1000} value={speed} onChange={setSpeed} />
      </div>

      <Stats>
        <div>🔍 Comparaciones: {comparisons}</div>
        <div>🔄 Movimientos: {moves}</div>
      </Stats>

      {/* VISUAL + PUNTEROS */}
      <BarsContainer>
        {elements.map((el, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: 18 }}>{pointers.i === i && '⬇ i'}{pointers.j === i && '⬇ j'}{pointers.k === i && '⬇ k'}</div>

            <Square state={el.state} size={getSize(el.value)}>
              {el.value}
            </Square>
          </div>
        ))}
      </BarsContainer>

      {/* LEYENDA REAL */}
      <Card>
        <b>Leyenda</b>
        <p>
          🔵 Default | 🟣 Dividing | 🟠 Merging | 🟢 Sorted
        </p>
      </Card>
    </Wrap>
  );
};

export default MergeSort;
