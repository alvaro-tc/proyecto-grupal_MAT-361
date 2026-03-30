import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; }`;

const Wrap = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(46,24,106,0.10);
  padding: 1.25rem 1rem 1rem;
  animation: ${fadeIn} 0.3s ease;
  overflow: auto;
  min-width: 260px;
  flex: 1;
`;

const Title = styled.div`
  font-family: 'Motiva Sans Bold', serif;
  font-size: 0.95rem;
  color: #2e186a;
  margin-bottom: 0.9rem;
  text-align: center;
  letter-spacing: 0.03em;
`;

const Table = styled.table`
  border-collapse: separate;
  border-spacing: 3px;
  font-size: 0.78rem;
  width: 100%;
`;

const HeaderCell = styled.th<{ bg?: string }>`
  background: ${({ bg }) => bg || '#2e186a'};
  color: #fff;
  padding: 8px 10px;
  border-radius: 6px;
  font-weight: 700;
  white-space: nowrap;
  min-width: 40px;
  text-align: center;
`;

const EmptyCorner = styled.th`
  background: transparent;
`;

const DataCell = styled.td<{ isNull: boolean; highlightColor?: string; isRowMin?: boolean; isColMin?: boolean }>`
  background: ${({ highlightColor, isNull }) => highlightColor ? highlightColor : (isNull ? '#f7f8fc' : '#eef2ff')};
  color: ${({ isNull, highlightColor }) => highlightColor ? '#fff' : (isNull ? '#b0b8c9' : '#2e186a')};
  font-weight: ${({ isNull }) => isNull ? 400 : 700};
  padding: 8px 10px;
  border-radius: 6px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  
  ${({ isRowMin, isColMin }) => (isRowMin || isColMin) && `
    box-shadow: inset 0 0 0 2px ${isRowMin ? '#faad14' : '#1890ff'};
  `}
`;

const InputCell = styled.input`
  width: 100%;
  min-width: 30px;
  background: transparent;
  border: none;
  text-align: center;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  outline: none;
  
  &::placeholder {
      color: inherit;
      opacity: 0.5;
  }
`;

export interface GraphNode { id: string; label: string; color: string; }
export interface GraphEdge { source: string; target: string; weight: string; }

interface Props {
  uNodes: GraphNode[];
  vNodes: GraphNode[];
  edges: GraphEdge[];
  editable?: boolean;
  onEdgeChange?: (sourceId: string, targetId: string, value: string) => void;
  overrideMatrix?: (number | string | null)[][];
  highlightCells?: { r: number, c: number, color: string }[];
  rowMins?: (number | null)[];
  colMins?: (number | null)[];
  lines?: { row: boolean[], col: boolean[] };
}

const CostMatrix = ({
  uNodes, vNodes, edges, editable = false, onEdgeChange, overrideMatrix,
  highlightCells = [], rowMins = [], colMins = [], lines = { row: [], col: [] }
}: Props) => {
  if (uNodes.length === 0 && vNodes.length === 0) {
      return (
          <Wrap>
              <Title>Matriz de Adyacencia</Title>
              <p style={{ textAlign: 'center', color: '#b0b8c9', fontSize: '0.82rem' }}>
                  Agrega orígenes y destinos para ver la matriz
              </p>
          </Wrap>
      );
  }

  // Dimensiones
  const ROWS = uNodes.length;
  const COLS = vNodes.length;
  
  // Mapeamos los índices para lectura rápida
  const uIdx = Object.fromEntries(uNodes.map((nd, i) => [nd.id, i]));
  const vIdx = Object.fromEntries(vNodes.map((nd, i) => [nd.id, i]));

  // Construimos matriz base desde edges (si no hay override)
  let matrix: (number | string | null)[][] = Array.from({ length: Math.max(ROWS, 1) }, () => Array(Math.max(COLS, 1)).fill(null));

  if (!overrideMatrix && ROWS > 0 && COLS > 0) {
      edges.forEach(edge => {
          const r = uIdx[edge.source];
          const c = vIdx[edge.target];
          if (r !== undefined && c !== undefined) {
              const w = parseFloat(edge.weight);
              matrix[r][c] = isNaN(w) ? null : w;
          }
      });
  } else if (overrideMatrix) {
      matrix = overrideMatrix;
  }

  return (
      <Wrap>
          <Title>Matriz de Adyacencia</Title>
          <div style={{ paddingBottom: 10, overflowX: 'auto' }}>
            <Table>
                <thead>
                    <tr>
                        <EmptyCorner />
                        {vNodes.map((nd, c) => (
                            <HeaderCell key={`col-${nd.id}`} bg={nd.color} style={{ opacity: lines.col[c] ? 0.4 : 1 }}>
                                {nd.label}
                            </HeaderCell>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {uNodes.map((rowNode, r) => (
                        <tr key={`row-${rowNode.id}`}>
                            <HeaderCell bg={rowNode.color} style={{ opacity: lines.row[r] ? 0.4 : 1 }}>
                                {rowNode.label}
                            </HeaderCell>
                            
                            {vNodes.map((colNode, c) => {
                                const val = matrix[r]?.[c] ?? null;
                                const displayVal = val !== null ? val : '∞';
                                const hColor = highlightCells.find(h => h.r === r && h.c === c)?.color;
                                
                                const isCrossedOut = lines.row[r] || lines.col[c];
                                const isDoubleCrossed = lines.row[r] && lines.col[c];
                                const isRowMin = val !== null && val !== '∞' && val === rowMins[r];
                                const isColMin = val !== null && val !== '∞' && val === colMins[c];

                                return (
                                    <DataCell 
                                        key={`cell-${r}-${c}`} 
                                        isNull={val === null || val === '∞'}
                                        highlightColor={hColor}
                                        isRowMin={isRowMin}
                                        isColMin={isColMin}
                                        style={{ 
                                            opacity: isCrossedOut && !isDoubleCrossed ? 0.5 : 1,
                                            background: isDoubleCrossed ? '#f87171' : undefined
                                        }}
                                    >
                                        {isCrossedOut && !isDoubleCrossed && (
                                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: '#ef4444', transform: 'translateY(-50%)' }} />
                                        )}
                                        {isDoubleCrossed && (
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 8, height: 8, borderRadius: '50%', background: 'white', transform: 'translate(-50%, -50%)' }} />
                                        )}
                                        
                                        {editable ? (
                                            <InputCell
                                                defaultValue={val !== null ? val.toString() : ''}
                                                placeholder="∞"
                                                onBlur={(e) => {
                                                    if (onEdgeChange) {
                                                        const newVal = e.target.value.trim();
                                                        onEdgeChange(rowNode.id, colNode.id, newVal === '∞' ? '' : newVal);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') e.currentTarget.blur();
                                                }}
                                            />
                                        ) : displayVal}
                                    </DataCell>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </Table>
          </div>
      </Wrap>
  );
};

export default CostMatrix;
