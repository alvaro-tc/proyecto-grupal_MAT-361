import React, { useState, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Button, InputNumber, Slider, message } from 'antd';
import {
  PlayCircleOutlined, DeleteOutlined,
  PlusOutlined, ExportOutlined, ImportOutlined,
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

const BarsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  align-items: flex-end;
`;

const Square = styled.div<{ state: ElementState }>`
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 8px;
  font-weight: bold;

  background: ${p =>
    p.state === 'sorted'   ? '#16a34a' :
    p.state === 'dividing' ? '#7c3aed' :
    p.state === 'merging'  ? '#f59e0b' :
    '#3b82f6'};

  ${p => (p.state === 'dividing' || p.state === 'merging') && css`
    animation: ${pulse} 0.6s ease;
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
  const [elements, setElements] = useState<SortElement[]>(makeElements([5,3,8,2,1]));
  const [simPhase, setSimPhase] = useState<SimPhase>('idle');
  const [speed, setSpeed] = useState(500);
  const [input, setInput] = useState<number | null>(null);

  const [comparisons, setComparisons] = useState(0);
  const [moves, setMoves] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Merge Sort ─────────────────────────────
  const handleSolve = useCallback(async () => {
    if (elements.length < 2) {
      message.info('Agrega al menos 2 elementos');
      return;
    }

    setComparisons(0);
    setMoves(0);
    setSimPhase('running');

    let arr = elements.map(e => e.value);

    const merge = async (l: number, m: number, r: number) => {
      let left = arr.slice(l, m + 1);
      let right = arr.slice(m + 1, r + 1);

      let i = 0, j = 0, k = l;

      while (i < left.length && j < right.length) {
        setComparisons(c => c + 1);

        setElements(arr.map((v, idx) => ({
          value: v,
          state: idx >= l && idx <= r ? 'merging' : 'default'
        })));

        await sleep(speed);

        if (left[i] <= right[j]) {
          arr[k++] = left[i++];
        } else {
          arr[k++] = right[j++];
        }

        setMoves(m => m + 1);
      }

      while (i < left.length) {
        arr[k++] = left[i++];
        setMoves(m => m + 1);
        await sleep(speed);
      }

      while (j < right.length) {
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
    setSimPhase('done');

  }, [elements, speed]);

  // ─── Controls ───────────────────────────────
  const handleAdd = () => {
    if (input === null) return;
    setElements(prev => [...prev, { value: input, state: 'default' }]);
    setInput(null);
  };

  const handleClear = () => setElements([]);

  // ✅ FIX IMPORT
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);

        if (!Array.isArray(data)) throw new Error();

        const nums = data.map((n: any) => {
          const val = Number(n);
          if (isNaN(val)) throw new Error();
          return val;
        });

        setElements(makeElements(nums));
        setSimPhase('idle');
        setComparisons(0);
        setMoves(0);

        message.success('Archivo cargado correctamente');
      } catch {
        message.error('JSON inválido');
      }

      if (fileRef.current) fileRef.current.value = '';
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

  // ─── UI ─────────────────────────────────────
  return (
    <Wrap>
      <h2>Merge Sort</h2>

      <Top>
        <InputNumber value={input} onChange={setInput} />
        <Button icon={<PlusOutlined />} onClick={handleAdd}>Agregar</Button>
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
        <input
          type="file"
          ref={fileRef}
          hidden
          accept=".json"
          onChange={handleImport}
        />
      </Top>

      <div style={{ marginTop: 10 }}>
        Velocidad:
        <Slider min={100} max={1000} value={speed} onChange={setSpeed} />
      </div>

      {/* ✅ NUEVO: STATS */}
      <Stats>
        <div>🔍 Comparaciones: {comparisons}</div>
        <div>🔄 Movimientos: {moves}</div>
      </Stats>
      

      

      <BarsContainer>
        {elements.map((el, i) => (
          <Square key={i} state={el.state}>
            {el.value}
          </Square>
        ))}
      </BarsContainer>

      <div style={{ marginTop: 20 }}>
        <b>Leyenda:</b> 🔵 Normal | 🟣 Dividir | 🟠 Merge | 🟢 Ordenado
      </div>
    </Wrap>
  );
};

export default MergeSort;

