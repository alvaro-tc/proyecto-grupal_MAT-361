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
  flex: 1; /* Allow it to grow dynamically */
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
  padding: 5px 7px;
  border-radius: 6px;
  font-weight: 700;
  white-space: nowrap;
  min-width: 34px;
  text-align: center;
  font-family: 'Motiva Sans Bold', serif;
`;

const EmptyCorner = styled.th`
  background: transparent;
`;

const DataCell = styled.td<{ isNull: boolean }>`
  background: ${({ isNull }) => isNull ? '#f7f8fc' : '#eef2ff'};
  color: ${({ isNull }) => isNull ? '#b0b8c9' : '#2e186a'};
  font-weight: ${({ isNull }) => isNull ? 400 : 700};
  padding: 5px 7px;
  border-radius: 6px;
  text-align: center;
  transition: background 0.2s;
  font-family: 'Motiva Sans Light', sans-serif;
`;

const SumCell = styled.td<{ type: 'row' | 'col' }>`
  background: ${({ type }) => type === 'row' ? '#f0e7ff' : '#e8f4fd'};
  color: ${({ type }) => type === 'row' ? '#7c3aed' : '#1890ff'};
  font-weight: 700;
  padding: 5px 7px;
  border-radius: 6px;
  text-align: center;
  font-family: 'Motiva Sans Bold', serif;
`;

const CountCell = styled.td<{ type: 'row' | 'col' }>`
  background: ${({ type }) => type === 'row' ? '#fef3c7' : '#d1fae5'};
  color: ${({ type }) => type === 'row' ? '#d97706' : '#059669'};
  font-weight: 700;
  padding: 5px 7px;
  border-radius: 6px;
  text-align: center;
  font-family: 'Motiva Sans Bold', serif;
`;

const LegendRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
  justify-content: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: #4a5568;
  font-family: 'Motiva Sans Light', sans-serif;
`;

const LegendDot = styled.div<{ bg: string }>`
  width: 10px; height: 10px;
  border-radius: 50%;
  background: ${({ bg }) => bg};
`;

interface GraphNode { id: string; label: string; color: string; }
interface GraphEdge { source: string; target: string; weight: string; isDirected: boolean; }

interface Props {
    nodes: GraphNode[];
    edges: GraphEdge[];
    editable?: boolean;
    onEdgeChange?: (sourceId: string, targetId: string, value: string) => void;
}

const InputCell = styled.input`
    width: 100%;
    min-width: 25px;
    height: 100%;
    background: transparent;
    border: none;
    text-align: center;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
    outline: none;
    margin: 0;
    padding: 0;
    cursor: text;
    
    &::placeholder {
        color: inherit;
        opacity: 0.5;
    }
    
    &:focus {
        background: transparent;
        /* No border or outline to keep it looking exactly like a normal cell */
    }
    
    /* Hide arrows in input number */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    -moz-appearance: textfield;
`;

const AdjacencyMatrix = ({ nodes, edges, editable = false, onEdgeChange }: Props) => {
    if (nodes.length === 0) {
        return (
            <Wrap>
                <Title>Matriz de Adyacencia</Title>
                <p style={{ textAlign: 'center', color: '#b0b8c9', fontSize: '0.82rem', fontFamily: 'Motiva Sans Light' }}>
                    Agrega nodos para ver la matriz
                </p>
            </Wrap>
        );
    }

    // Build n×n matrix: cell[i][j] = sum of weights of directed edges i→j (or null if no connection)
    const n = nodes.length;
    const idx = Object.fromEntries(nodes.map((nd, i) => [nd.id, i]));
    const matrix: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));

    edges.forEach(edge => {
        const r = idx[edge.source];
        const c = idx[edge.target];
        if (r !== undefined && c !== undefined) {
            const w = parseFloat(edge.weight);
            const val = isNaN(w) ? 1 : w;
            matrix[r][c] = matrix[r][c] === null ? val : matrix[r][c]! + val;
        }
    });

    const rowSums = matrix.map(row => row.reduce<number>((a, b) => a + (b || 0), 0));
    const colSums = nodes.map((_, c) => matrix.reduce<number>((a, row) => a + (row[c] || 0), 0));
    const rowCounts = matrix.map(row => row.filter(v => v !== null).length);
    const colCounts = nodes.map((_, c) => matrix.filter(row => row[c] !== null).length);

    return (
        <Wrap>
            <Title>Matriz de Adyacencia</Title>
            <Table>
                <thead>
                    <tr>
                        <EmptyCorner />
                        {nodes.map(nd => (
                            <HeaderCell key={nd.id} bg={nd.color}>{nd.label}</HeaderCell>
                        ))}
                        <HeaderCell bg="#7c3aed" title="Suma de fila">Σ</HeaderCell>
                        <HeaderCell bg="#d97706" title="Elementos ≠ 0 en fila">n</HeaderCell>
                    </tr>
                </thead>
                <tbody>
                    {nodes.map((rowNode, r) => (
                        <tr key={rowNode.id}>
                            <HeaderCell bg={rowNode.color}>{rowNode.label}</HeaderCell>
                            {matrix[r].map((val, c) => {
                                const targetNode = nodes[c];
                                const currentValStr = val !== null ? val.toString() : '';
                                const displayVal = val !== null ? val : '-';

                                return (
                                    <DataCell key={c} isNull={val === null}>
                                        {editable ? (
                                            <InputCell
                                                defaultValue={currentValStr}
                                                placeholder="-"
                                                onBlur={(e) => {
                                                    if (onEdgeChange) {
                                                        const newVal = e.target.value.trim();
                                                        if (newVal !== currentValStr && !(newVal === '-' && currentValStr === '')) {
                                                            // treat '-' as empty/null
                                                            onEdgeChange(rowNode.id, targetNode.id, newVal === '-' ? '' : newVal);
                                                        }
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.currentTarget.blur();
                                                    }
                                                }}
                                            />
                                        ) : (
                                            displayVal
                                        )}
                                    </DataCell>
                                );
                            })}
                            <SumCell type="row">{rowSums[r]}</SumCell>
                            <CountCell type="row">{rowCounts[r]}</CountCell>
                        </tr>
                    ))}
                    {/* Column sums row */}
                    <tr>
                        <HeaderCell bg="#1890ff" title="Suma de columna">Σ</HeaderCell>
                        {colSums.map((s, c) => (
                            <SumCell key={c} type="col">{s}</SumCell>
                        ))}
                        <td />
                        <td />
                    </tr>
                    {/* Column counts row */}
                    <tr>
                        <HeaderCell bg="#059669" title="Elementos ≠ 0 en columna">n</HeaderCell>
                        {colCounts.map((cnt, c) => (
                            <CountCell key={c} type="col">{cnt}</CountCell>
                        ))}
                        <td />
                        <td />
                    </tr>
                </tbody>
            </Table>

            <LegendRow>
                <LegendItem><LegendDot bg="#eef2ff" style={{ border: '1.5px solid #c4b5fd' }} />Conexión</LegendItem>
                <LegendItem><LegendDot bg="#f7f8fc" />Sin conexión (-)</LegendItem>
                <LegendItem><LegendDot bg="#f0e7ff" />Σ fila</LegendItem>
                <LegendItem><LegendDot bg="#e8f4fd" />Σ col</LegendItem>
                <LegendItem><LegendDot bg="#fef3c7" />n fila</LegendItem>
                <LegendItem><LegendDot bg="#d1fae5" />n col</LegendItem>
            </LegendRow>
        </Wrap>
    );
};

export default AdjacencyMatrix;
