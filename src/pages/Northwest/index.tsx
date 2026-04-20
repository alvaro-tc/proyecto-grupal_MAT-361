import React, { useState, useCallback, useRef, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { Switch, Modal, Input, Button, message, Slider } from "antd";
import {
    PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined,
    SettingOutlined, DeleteOutlined, InfoCircleOutlined,
    DownloadOutlined, UploadOutlined, StepForwardOutlined,
} from "@ant-design/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NorthwestData {
    costos: (number | null)[][];
    oferta: (number | null)[];
    demanda: (number | null)[];
}

interface IterationStep {
    asignacion: number[][];
    ofertaRestante: number[];
    demandaRestante: number[];
    fila: number;
    columna: number;
    cantidad: number;
    costoParcial: number;
}

type SimState = 'idle' | 'running' | 'paused' | 'done';

// ─── Animations ───────────────────────────────────────────────────────────────
const pulse = keyframes`
    0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0); }
`;

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const highlight = keyframes`
    0% { background-color: rgba(139, 92, 246, 0.2); }
    50% { background-color: rgba(139, 92, 246, 0.4); }
    100% { background-color: rgba(139, 92, 246, 0.2); }
`;

// ─── Styled Components ────────────────────────────────────────────────────────
const Wrap = styled.div`
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 60px);
    padding: 1rem 2rem 2rem;
    gap: 1rem;
    background: #f8fafc;
`;

const SimBar = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    background: white;
    padding: 0.75rem 1.25rem;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(46, 24, 106, 0.08);
    justify-content: flex-start;
`;

const SimBarLabel = styled.span`
    font-size: 0.82rem;
    color: #4a5568;
    font-weight: 500;
`;

const MainContent = styled.div`
    display: flex;
    gap: 1rem;
    flex: 1;
`;

const LeftSidebar = styled.div<{ visible: boolean }>`
    width: ${p => p.visible ? '280px' : '0'};
    flex-shrink: 0;
    background: white;
    border-radius: 16px;
    padding: ${p => p.visible ? '1.25rem 1rem' : '0'};
    box-shadow: 0 4px 12px rgba(46, 24, 106, 0.08);
    overflow-y: auto;
    max-height: 700px;
    transition: all 0.3s ease;
    opacity: ${p => p.visible ? 1 : 0};
`;

const CenterPanel = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
`;

const TableContainer = styled.div`
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(46, 24, 106, 0.08);
    animation: ${fadeIn} 0.4s ease;
`;

const MatrixTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    
    th {
        background: #2e186a;
        color: white;
        padding: 12px;
        font-weight: 500;
        text-align: center;
        border: 1px solid #e2e8f0;
        
        &:first-child {
            border-top-left-radius: 8px;
        }
        
        &:last-child {
            border-top-right-radius: 8px;
        }
    }
    
    td {
        border: 1px solid #e2e8f0;
        padding: 8px;
        text-align: center;
        background: white;
        transition: all 0.3s ease;
    }
`;

interface CellInputProps {
    isActive?: boolean;
    isAssigned?: boolean;
}

const CellInput = styled.input<CellInputProps>`
    width: 100%;
    padding: 8px;
    text-align: center;
    border: 2px solid ${p => p.isActive ? '#8b5cf6' : p.isAssigned ? '#52c41a' : '#e2e8f0'};
    border-radius: 6px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    box-sizing: border-box;
    background: ${p => p.isAssigned ? '#f6ffed' : 'white'};
    animation: ${p => p.isActive ? css`${pulse} 2s infinite` : 'none'};
    
    &:focus {
        outline: none;
        border-color: #8b5cf6;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    }
    
    &:disabled {
        background: #f7fafc;
        color: #4a5568;
        cursor: not-allowed;
    }
    
    &::placeholder {
        color: #cbd5e0;
        font-size: 0.85rem;
    }
`;

const ResultCell = styled.td<{ isAssigned?: boolean; isActive?: boolean }>`
    padding: 12px !important;
    font-weight: ${p => p.isAssigned ? '600' : '400'};
    background: ${p => p.isActive ? 'rgba(139, 92, 246, 0.1)' : p.isAssigned ? '#f6ffed' : 'white'} !important;
    animation: ${p => p.isActive ? css`${highlight} 1.5s infinite` : 'none'};
    border: ${p => p.isActive ? '2px solid #8b5cf6' : '1px solid #e2e8f0'} !important;
`;

const SumsContainer = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1rem 0 0;
    flex-wrap: wrap;
`;

const SumBadge = styled.div<{ variant: 'offer' | 'demand' }>`
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    background: ${p => p.variant === 'offer' ? 'rgba(46, 24, 106, 0.08)' : 'rgba(24, 144, 255, 0.08)'};
    color: ${p => p.variant === 'offer' ? '#2e186a' : '#1890ff'};
    
    strong {
        font-size: 1.1rem;
        margin-left: 0.5rem;
    }
`;

const WarningBadge = styled.div`
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    background: rgba(250, 173, 20, 0.1);
    color: #d48806;
    margin-left: auto;
`;

const IterationPanel = styled.div`
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(46, 24, 106, 0.08);
    animation: ${fadeIn} 0.4s ease;
`;

const IterationHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    
    h3 {
        color: #2e186a;
        margin: 0;
        font-size: 1.2rem;
    }
`;

const IterationControls = styled.div`
    display: flex;
    gap: 0.5rem;
`;

const CostTotal = styled.div`
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 2px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    span {
        color: #4a5568;
        font-size: 1rem;
    }
    
    strong {
        font-size: 1.8rem;
        color: #8b5cf6;
    }
`;

const ToolGroup = styled.div`
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
`;

const IconButton = styled(Button)`
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 4px;
`;

// ─── Constantes ──────────────────────────────────────────────────────────────
const FILAS_INICIALES = 3;
const COLUMNAS_INICIALES = 3;

// ─── Helper Functions ─────────────────────────────────────────────────────────
const crearMatrizVacia = (filas: number, columnas: number): (number | null)[][] =>
    Array.from({ length: filas }, () => Array(columnas).fill(null));

const crearArrayVacio = (length: number): (number | null)[] =>
    Array(length).fill(null);

const validarMatriz = (
    costos: (number | null)[][], 
    oferta: (number | null)[], 
    demanda: (number | null)[]
): { valid: boolean; error?: string } => {
    if (costos.some(fila => fila.some(v => v === null))) {
        return { valid: false, error: "Todos los costos deben tener un valor" };
    }
    if (oferta.some(v => v === null)) {
        return { valid: false, error: "Todas las ofertas deben tener un valor" };
    }
    if (demanda.some(v => v === null)) {
        return { valid: false, error: "Todas las demandas deben tener un valor" };
    }
    
    if (costos.some(fila => fila.some(v => v! < 0))) {
        return { valid: false, error: "Los costos no pueden ser negativos" };
    }
    if (oferta.some(v => v! < 0)) {
        return { valid: false, error: "Las ofertas no pueden ser negativas" };
    }
    if (demanda.some(v => v! < 0)) {
        return { valid: false, error: "Las demandas no pueden ser negativas" };
    }
    
    return { valid: true };
};

const convertirANumeros = (
    costos: (number | null)[][], 
    oferta: (number | null)[], 
    demanda: (number | null)[]
): { costos: number[][], oferta: number[], demanda: number[] } => {
    return {
        costos: costos.map(fila => fila.map(v => v!)),
        oferta: oferta.map(v => v!),
        demanda: demanda.map(v => v!)
    };
};

const calcularIteraciones = (
    costos: number[][],
    oferta: number[],
    demanda: number[]
): IterationStep[] => {
    const iteraciones: IterationStep[] = [];
    const ofertaRest = [...oferta];
    const demandaRest = [...demanda];
    const asignacion = Array.from({ length: oferta.length }, () => Array(demanda.length).fill(0));
    
    let fila = 0;
    let columna = 0;
    let costoTotal = 0;
    const EPSILON = 1e-6;
    
    while (fila < oferta.length && columna < demanda.length) {
        const cantidad = Math.min(ofertaRest[fila], demandaRest[columna]);
        asignacion[fila][columna] = cantidad;
        
        ofertaRest[fila] -= cantidad;
        demandaRest[columna] -= cantidad;
        costoTotal += cantidad * costos[fila][columna];
        
        iteraciones.push({
            asignacion: asignacion.map(f => [...f]),
            ofertaRestante: [...ofertaRest],
            demandaRestante: [...demandaRest],
            fila,
            columna,
            cantidad,
            costoParcial: costoTotal,
        });
        
        if (ofertaRest[fila] <= EPSILON) fila++;
        if (demandaRest[columna] <= EPSILON) columna++;
    }
    
    return iteraciones;
};

// Función helper para obtener el valor del input
const getInputValue = (val: number | null): string | number => {
    return val !== null ? val : '';
};

// ─── Main Component ───────────────────────────────────────────────────────────
const NorthwestPage: React.FC = () => {
    const [matrizCostos, setMatrizCostos] = useState<(number | null)[][]>(() =>
        crearMatrizVacia(FILAS_INICIALES, COLUMNAS_INICIALES)
    );
    const [oferta, setOferta] = useState<(number | null)[]>(() => 
        crearArrayVacio(FILAS_INICIALES)
    );
    const [demanda, setDemanda] = useState<(number | null)[]>(() => 
        crearArrayVacio(COLUMNAS_INICIALES)
    );
    
    const [showInstructions, setShowInstructions] = useState(true);
    const [optimizationGoal, setOptimizationGoal] = useState<'min' | 'max'>('min');
    const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [simState, setSimState] = useState<SimState>('idle');
    const [simSpeed, setSimSpeed] = useState(1200);
    const [iteraciones, setIteraciones] = useState<IterationStep[]>([]);
    const [currentIteration, setCurrentIteration] = useState(0);
    const [resultadoFinal, setResultadoFinal] = useState<number[][] | null>(null);
    const [costoTotalFinal, setCostoTotalFinal] = useState<number | null>(null);
    
    const [isExportModalVisible, setIsExportModalVisible] = useState(false);
    const [exportFileName, setExportFileName] = useState('northwest');
    
    const simSpeedRef = useRef(310);
    const simAbort = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        simSpeedRef.current = 1510 - simSpeed;
    }, [simSpeed]);

    const sleep = () => new Promise<void>(res => setTimeout(res, simSpeedRef.current));

    const sumaOferta = oferta.reduce<number>((acc, val) => acc + (val || 0), 0);
    const sumaDemanda = demanda.reduce<number>((acc, val) => acc + (val || 0), 0);
    const isBalanced = Math.abs(sumaOferta - sumaDemanda) < 1e-6;
    
    const validateInputs = useCallback((): string | null => {
        if (matrizCostos.length < 2) return "Debe haber al menos 2 orígenes";
        if (matrizCostos[0].length < 2) return "Debe haber al menos 2 destinos";
        
        const validation = validarMatriz(matrizCostos, oferta, demanda);
        if (!validation.valid) return validation.error!;
        
        return null;
    }, [matrizCostos, oferta, demanda]);

    const runSimulation = useCallback(async () => {
        const error = validateInputs();
        if (error) {
            Modal.error({ title: "Datos inválidos", content: error, centered: true });
            return;
        }
        
        let currentCostos = matrizCostos;
        let currentOferta = oferta;
        let currentDemanda = demanda;
        
        const currentSumaOferta = currentOferta.reduce<number>((acc, val) => acc + (val || 0), 0);
        const currentSumaDemanda = currentDemanda.reduce<number>((acc, val) => acc + (val || 0), 0);

        if (Math.abs(currentSumaOferta - currentSumaDemanda) > 1e-6) {
            message.info("Balanceando matriz automáticamente...");
            currentCostos = currentCostos.map(fila => [...fila]);
            currentOferta = [...currentOferta];
            currentDemanda = [...currentDemanda];
            
            if (currentSumaOferta > currentSumaDemanda) {
                currentCostos.forEach(fila => fila.push(0));
                currentDemanda.push(currentSumaOferta - currentSumaDemanda);
            } else {
                currentCostos.push(Array(currentCostos[0].length).fill(0));
                currentOferta.push(currentSumaDemanda - currentSumaOferta);
            }
            
            setMatrizCostos(currentCostos);
            setOferta(currentOferta);
            setDemanda(currentDemanda);
        }
        
        simAbort.current = false;
        setSimState('running');
        setResultadoFinal(null);
        setCostoTotalFinal(null);
        
        const datosConvertidos = convertirANumeros(currentCostos, currentOferta, currentDemanda);
        const todasIteraciones = calcularIteraciones(
            datosConvertidos.costos, 
            datosConvertidos.oferta, 
            datosConvertidos.demanda
        );
        setIteraciones(todasIteraciones);
        setCurrentIteration(0);
        
        for (let i = 0; i < todasIteraciones.length; i++) {
            if (simAbort.current) {
                setSimState('idle');
                return;
            }
            
            setCurrentIteration(i);
            await sleep();
        }
        
        if (!simAbort.current) {
            const ultimaIteracion = todasIteraciones[todasIteraciones.length - 1];
            setResultadoFinal(ultimaIteracion.asignacion);
            setCostoTotalFinal(ultimaIteracion.costoParcial);
            setSimState('done');
            message.success('¡Solución encontrada!');
        }
    }, [matrizCostos, oferta, demanda, isBalanced, validateInputs]);

    const stopSimulation = () => {
        simAbort.current = true;
        setSimState('idle');
        setCurrentIteration(0);
    };

    const resetSimulation = () => {
        simAbort.current = true;
        setSimState('idle');
        setCurrentIteration(0);
        setResultadoFinal(null);
        setCostoTotalFinal(null);
        setIteraciones([]);
    };

    const stepForward = () => {
        if (currentIteration < iteraciones.length - 1) {
            setCurrentIteration(prev => prev + 1);
        } else if (currentIteration === iteraciones.length - 1) {
            const ultima = iteraciones[iteraciones.length - 1];
            setResultadoFinal(ultima.asignacion);
            setCostoTotalFinal(ultima.costoParcial);
            setSimState('done');
            message.success('¡Solución encontrada!');
        }
    };

    const stepBackward = () => {
        if (currentIteration > 0) {
            setCurrentIteration(prev => prev - 1);
        }
    };

    const actualizarCosto = (fila: number, columna: number, valor: string) => {
        const numero = valor === '' ? null : parseFloat(valor);
        setMatrizCostos(prev =>
            prev.map((f, i) =>
                i === fila ? f.map((v, j) => (j === columna ? numero : v)) : f
            )
        );
        resetSimulation();
    };

    const actualizarOferta = (fila: number, valor: string) => {
        const numero = valor === '' ? null : parseFloat(valor);
        setOferta(prev => prev.map((v, i) => (i === fila ? numero : v)));
        resetSimulation();
    };

    const actualizarDemanda = (columna: number, valor: string) => {
        const numero = valor === '' ? null : parseFloat(valor);
        setDemanda(prev => prev.map((v, i) => (i === columna ? numero : v)));
        resetSimulation();
    };

    const agregarFila = () => {
        setMatrizCostos(prev => [...prev, Array(prev[0].length).fill(null)]);
        setOferta(prev => [...prev, null]);
        resetSimulation();
    };

    const agregarColumna = () => {
        setMatrizCostos(prev => prev.map(fila => [...fila, null]));
        setDemanda(prev => [...prev, null]);
        resetSimulation();
    };

    const eliminarFila = () => {
        if (matrizCostos.length <= 2) {
            message.warning("Debe haber al menos 2 orígenes");
            return;
        }
        setMatrizCostos(prev => prev.slice(0, -1));
        setOferta(prev => prev.slice(0, -1));
        resetSimulation();
    };

    const eliminarColumna = () => {
        if (matrizCostos[0].length <= 2) {
            message.warning("Debe haber al menos 2 destinos");
            return;
        }
        setMatrizCostos(prev => prev.map(fila => fila.slice(0, -1)));
        setDemanda(prev => prev.slice(0, -1));
        resetSimulation();
    };

    const cargarEjemplo = () => {
        setMatrizCostos([
            [10, 20, 30],
            [15, 25, 35],
            [20, 30, 40]
        ]);
        setOferta([100, 150, 200]);
        setDemanda([150, 200, 100]);
        resetSimulation();
        message.success("Ejemplo cargado");
    };

    const limpiarTodo = () => {
        Modal.confirm({
            title: '¿Limpiar todo?',
            content: 'Se eliminarán todos los datos actuales.',
            okText: 'Sí, limpiar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: () => {
                setMatrizCostos(crearMatrizVacia(FILAS_INICIALES, COLUMNAS_INICIALES));
                setOferta(crearArrayVacio(FILAS_INICIALES));
                setDemanda(crearArrayVacio(COLUMNAS_INICIALES));
                resetSimulation();
                message.success("Datos reiniciados");
            }
        });
    };

    const handleExportJSON = () => {
        setExportFileName('northwest');
        setIsExportModalVisible(true);
    };
    
    const doExportJSON = () => {
        const name = exportFileName.trim() || 'northwest';
        const data: NorthwestData = { 
            costos: matrizCostos, 
            oferta, 
            demanda 
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExportModalVisible(false);
        message.success('Datos exportados correctamente');
    };

    const importarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data: NorthwestData = JSON.parse(ev.target?.result as string);
                if (data.costos && data.oferta && data.demanda) {
                    setMatrizCostos(data.costos);
                    setOferta(data.oferta);
                    setDemanda(data.demanda);
                    resetSimulation();
                    message.success('Datos importados correctamente');
                } else {
                    throw new Error('Formato inválido');
                }
            } catch {
                message.error('El archivo no tiene el formato correcto');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const iteracionActual = iteraciones[currentIteration] || null;
    const mostrarResultado = simState === 'done' && resultadoFinal;
    const mostrarIteracion = (simState === 'running' || simState === 'paused') && iteracionActual;

    return (
        <Wrap>
            <SimBar>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 800, color: '#2e186a', fontSize: '1.2rem' }}>
                        Algoritmo North West Corner
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: isBalanced ? '#f0fdf4' : '#fff7ed',
                        border: `1px solid ${isBalanced ? '#86efac' : '#fed7aa'}`,
                        borderRadius: 20, padding: '3px 10px', fontSize: '0.78rem',
                        color: isBalanced ? '#16a34a' : '#ea580c', fontWeight: 600,
                    }}>
                        {isBalanced ? '✅ Balanceado' : '⚠ No balanceado'}
                    </div>
                </div>

                <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => {
                        const error = validateInputs();
                        if (error) {
                            Modal.error({ title: "Datos inválidos", content: error, centered: true });
                            return;
                        }
                        setIsGoalModalVisible(true);
                    }}
                    disabled={simState === 'running'}
                    style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 20 }}
                >
                    Comenzar
                </Button>

                <Button
                    danger
                    icon={<PauseCircleOutlined />}
                    onClick={stopSimulation}
                    disabled={simState !== 'running'}
                    style={{ borderRadius: 20 }}
                />

                <Button
                    icon={<ReloadOutlined />}
                    onClick={resetSimulation}
                    style={{ borderRadius: 20, borderColor: '#8b5cf6', color: '#8b5cf6' }}
                />

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
                
                <SimBarLabel>Lento</SimBarLabel>
                <div style={{ width: 160 }}>
                    <Slider
                        min={10} max={1500} step={10}
                        value={simSpeed} onChange={setSimSpeed}
                        tooltip={{ formatter: (v) => `${1510 - (v ?? 0)}ms/paso` }}
                        trackStyle={{ background: '#2e186a' }}
                        handleStyle={{ borderColor: '#2e186a' }}
                    />
                </div>
                <SimBarLabel>Rápido</SimBarLabel>

                <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />
                
                <IconButton
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={handleExportJSON}
                    style={{ color: '#096dd9', borderColor: '#91d5ff', background: '#e6f7ff' }}
                >
                    Exportar
                </IconButton>
                
                <IconButton
                    size="small"
                    icon={<UploadOutlined />}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ color: '#389e0d', borderColor: '#b7eb8f', background: '#f6ffed' }}
                >
                    Importar
                </IconButton>
                <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importarJSON} />
                
                <IconButton
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={limpiarTodo}
                    style={{ color: '#cf1322', borderColor: '#ffa39e', background: '#fff1f0' }}
                >
                    Limpiar
                </IconButton>

                <Button
                    size="small"
                    icon={<SettingOutlined />}
                    onClick={() => setIsSettingsOpen(true)}
                    style={{ borderRadius: 20 }}
                />
            </SimBar>

            <MainContent>
                <LeftSidebar visible={showInstructions}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#2e186a', fontSize: '0.9rem' }}>
                            <InfoCircleOutlined /> Instrucciones
                        </strong>
                    </div>
                    
                    <p style={{ fontWeight: 700, color: '#1e293b', margin: '0.5rem 0 0.25rem', fontSize: '0.9rem' }}>
                        📊 Configuración
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#334155', lineHeight: '1.7' }}>
                        <li>Haz clic en cada celda para ingresar los <b>costos unitarios</b>.</li>
                        <li>Completa los valores de <b>Oferta</b> (filas) y <b>Demanda</b> (columnas).</li>
                        <li>Usa los botones para agregar/eliminar filas y columnas.</li>
                        <li>El indicador muestra si el problema está <b>balanceado</b>.</li>
                    </ul>
                    
                    <p style={{ fontWeight: 700, color: '#1e293b', margin: '0.75rem 0 0.25rem', fontSize: '0.9rem' }}>
                        🎯 Método de la Esquina Noroeste
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#334155', lineHeight: '1.7' }}>
                        <li>Comienza en la celda superior izquierda (noroeste).</li>
                        <li>Asigna la <b>máxima cantidad posible</b> según oferta/demanda.</li>
                        <li>Avanza hacia la derecha si la demanda se satisface.</li>
                        <li>Avanza hacia abajo si la oferta se agota.</li>
                        <li>Repite hasta asignar todas las unidades.</li>
                    </ul>
                    
                    <p style={{ fontWeight: 700, color: '#1e293b', margin: '0.75rem 0 0.25rem', fontSize: '0.9rem' }}>
                        ⚡ Simulación
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#334155', lineHeight: '1.7' }}>
                        <li><b>Comenzar:</b> Inicia la animación paso a paso.</li>
                        <li><b>Velocidad:</b> Ajusta el tiempo entre iteraciones.</li>
                        <li><b>Pausar/Reiniciar:</b> Controla la ejecución.</li>
                        <li>Las celdas activas se resaltan en <b style={{ color: '#8b5cf6' }}>púrpura</b>.</li>
                        <li>Las asignaciones aparecen en <b style={{ color: '#52c41a' }}>verde</b>.</li>
                    </ul>
                    
                    <p style={{ fontWeight: 700, color: '#1e293b', margin: '0.75rem 0 0.25rem', fontSize: '0.9rem' }}>
                        💾 Datos
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#334155', lineHeight: '1.7' }}>
                        <li><b>Exportar JSON:</b> Guarda la configuración actual con nombre personalizado.</li>
                        <li><b>Importar JSON:</b> Carga una configuración guardada.</li>
                        <li><b>Ejemplo:</b> Carga un problema de ejemplo.</li>
                    </ul>
                </LeftSidebar>

                <CenterPanel>
                    <TableContainer>
                        <h3 style={{ color: '#2e186a', margin: '0 0 1rem 0' }}>
                            📋 Matriz de {optimizationGoal === 'max' ? 'Beneficios' : 'Costos'}
                        </h3>
                        
                        <MatrixTable>
                            <thead>
                                <tr>
                                    <th></th>
                                    {demanda.map((_, i) => (
                                        <th key={i}>Destino {i + 1}</th>
                                    ))}
                                    <th>Oferta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matrizCostos.map((fila, i) => (
                                    <tr key={i}>
                                        <th style={{ background: '#2e186a', color: 'white' }}>Origen {i + 1}</th>
                                        {fila.map((costo, j) => {
                                            const isActive = mostrarIteracion && 
                                                iteracionActual.fila === i && 
                                                iteracionActual.columna === j;
                                            const isAssigned = mostrarIteracion && 
                                                iteracionActual.asignacion[i][j] > 0;
                                            
                                            return (
                                                <td key={j}>
                                                    <CellInput
                                                        type="number"
                                                        value={getInputValue(costo)}
                                                        onChange={e => actualizarCosto(i, j, e.target.value)}
                                                        disabled={simState === 'running'}
                                                        isActive={isActive}
                                                        isAssigned={isAssigned}
                                                        placeholder="0"
                                                        min="0"
                                                        step="1"
                                                    />
                                                </td>
                                            );
                                        })}
                                        <td>
                                            <CellInput
                                                type="number"
                                                value={getInputValue(oferta[i])}
                                                onChange={e => actualizarOferta(i, e.target.value)}
                                                disabled={simState === 'running'}
                                                placeholder="0"
                                                min="0"
                                                step="1"
                                            />
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <th style={{ background: '#2e186a', color: 'white' }}>Demanda</th>
                                    {demanda.map((valor, i) => (
                                        <td key={i}>
                                            <CellInput
                                                type="number"
                                                value={getInputValue(valor)}
                                                onChange={e => actualizarDemanda(i, e.target.value)}
                                                disabled={simState === 'running'}
                                                placeholder="0"
                                                min="0"
                                                step="1"
                                            />
                                        </td>
                                    ))}
                                    <td></td>
                                </tr>
                            </tbody>
                        </MatrixTable>
                        
                        <SumsContainer>
                            <SumBadge variant="offer">
                                Σ Oferta: <strong>{sumaOferta}</strong>
                            </SumBadge>
                            <SumBadge variant="demand">
                                Σ Demanda: <strong>{sumaDemanda}</strong>
                            </SumBadge>
                            {!isBalanced && (
                                <WarningBadge>
                                    ⚠️ Oferta ≠ Demanda - La solución puede no ser óptima
                                </WarningBadge>
                            )}
                        </SumsContainer>
                        
                        <ToolGroup style={{ marginTop: '1rem' }}>
                            <Button size="small" onClick={agregarFila}>➕ Agregar Fila</Button>
                            <Button size="small" onClick={agregarColumna}>➕ Agregar Columna</Button>
                            <Button size="small" onClick={eliminarFila}>✖️ Eliminar Fila</Button>
                            <Button size="small" onClick={eliminarColumna}>✖️ Eliminar Columna</Button>
                            <Button size="small" onClick={cargarEjemplo}>📋 Ejemplo</Button>
                        </ToolGroup>
                    </TableContainer>

                    {(mostrarIteracion || mostrarResultado) && (
                        <IterationPanel>
                            <IterationHeader>
                                <h3>
                                    {mostrarResultado ? '📊 Matriz de Asignación Final' : 
                                     `🔄 Iteración ${currentIteration + 1} de ${iteraciones.length}`}
                                </h3>
                                {mostrarIteracion && (
                                    <IterationControls>
                                        <Button 
                                            size="small" 
                                            onClick={stepBackward}
                                            disabled={currentIteration === 0}
                                        >
                                            ◀ Anterior
                                        </Button>
                                        <Button 
                                            size="small" 
                                            type="primary"
                                            onClick={stepForward}
                                            icon={<StepForwardOutlined />}
                                        >
                                            Siguiente
                                        </Button>
                                    </IterationControls>
                                )}
                            </IterationHeader>
                            
                            {mostrarIteracion && (
                                <div style={{ 
                                    marginBottom: '1rem', 
                                    padding: '0.75rem', 
                                    background: '#f0fdf4', 
                                    borderRadius: '8px',
                                    color: '#16a34a'
                                }}>
                                    <strong>Asignando:</strong> {iteracionActual.cantidad} unidades de Origen {iteracionActual.fila + 1} a Destino {iteracionActual.columna + 1}
                                    ({optimizationGoal === 'max' ? 'beneficio' : 'costo'} unitario: {matrizCostos[iteracionActual.fila]?.[iteracionActual.columna]})<br/>
                                    <strong>{optimizationGoal === 'max' ? 'Beneficio' : 'Costo'} parcial:</strong> {iteracionActual.costoParcial}
                                </div>
                            )}
                            
                            <MatrixTable>
                                <thead>
                                    <tr>
                                        <th></th>
                                        {demanda.map((_, i) => (
                                            <th key={i}>Destino {i + 1}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(mostrarResultado ? resultadoFinal : iteracionActual?.asignacion || []).map((fila, i) => (
                                        <tr key={i}>
                                            <th style={{ background: '#2e186a', color: 'white' }}>Origen {i + 1}</th>
                                            {fila.map((valor, j) => {
                                                const isActive = mostrarIteracion && 
                                                    iteracionActual.fila === i && 
                                                    iteracionActual.columna === j;
                                                const costo = matrizCostos[i]?.[j] || 0;
                                                
                                                return (
                                                    <ResultCell 
                                                        key={j} 
                                                        isAssigned={valor > 0}
                                                        isActive={isActive}
                                                    >
                                                        {valor > 0 ? (
                                                            <span>
                                                                {valor} <span style={{ color: '#8b5cf6', fontSize: '0.8rem' }}>({costo})</span>
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: '#cbd5e0' }}>0</span>
                                                        )}
                                                    </ResultCell>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </MatrixTable>
                            
                            <CostTotal>
                                <span>{optimizationGoal === 'max' ? 'Beneficio Total:' : 'Costo Total:'}</span>
                                <strong>
                                    {mostrarResultado ? costoTotalFinal?.toFixed(2) : 
                                     iteracionActual?.costoParcial.toFixed(2)}
                                </strong>
                            </CostTotal>
                            
                            {mostrarResultado && !isBalanced && (
                                <div style={{ 
                                    marginTop: '1rem', 
                                    padding: '0.5rem', 
                                    background: '#fff7ed', 
                                    borderRadius: '6px',
                                    color: '#ea580c',
                                    fontSize: '0.85rem'
                                }}>
                                    ⚠️ Esta solución puede no ser óptima. El problema no está balanceado.
                                </div>
                            )}
                        </IterationPanel>
                    )}
                </CenterPanel>
            </MainContent>

            <Modal
                title={<div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, color: '#2e186a' }}>💾 Exportar JSON</div>}
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
                        placeholder="Ej. mi-problema-transporte"
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

            <Modal
                title={<div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, color: '#2e186a' }}>⚙️ Configuración</div>}
                open={isSettingsOpen}
                onCancel={() => setIsSettingsOpen(false)}
                footer={null}
                centered
                closeIcon={null}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#4a5568', fontWeight: 500 }}>Mostrar Instrucciones</span>
                        <Switch checked={showInstructions} onChange={setShowInstructions} />
                    </div>
                    
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 12, display: 'flex', justifyContent: 'center', gap: 12 }}>
                        <Button 
                            danger 
                            shape="round" 
                            onClick={limpiarTodo}
                        >
                            Limpiar Todo
                        </Button>
                        <Button 
                            shape="round" 
                            type="primary" 
                            onClick={() => setIsSettingsOpen(false)}
                            style={{ background: '#2e186a', borderColor: '#2e186a' }}
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                title={<div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, color: '#2e186a' }}>🎯 Objetivo de Optimización</div>}
                open={isGoalModalVisible}
                onCancel={() => setIsGoalModalVisible(false)}
                onOk={() => {
                    setIsGoalModalVisible(false);
                    runSimulation();
                }}
                okText="Comenzar Simulación"
                cancelText="Cancelar"
                centered
            >
                <div style={{ padding: '1rem 0' }}>
                    <p style={{ color: '#4a5568', marginBottom: '1rem' }}>
                        Selecciona el objetivo para el problema de transporte:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div
                            style={{
                                padding: '12px 16px',
                                border: '2px solid ' + (optimizationGoal === 'min' ? '#2e186a' : '#e2e8f0'),
                                borderRadius: 8,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: optimizationGoal === 'min' ? '#f5f3ff' : 'white'
                            }}
                            onClick={() => setOptimizationGoal('min')}
                        >
                            <input type="radio" checked={optimizationGoal === 'min'} readOnly style={{ marginRight: 10 }} />
                            <strong>Minimizar Costos</strong> <span style={{ color: '#718096' }}>(ej. Reducir gastos de transporte)</span>
                        </div>
                        <div
                            style={{
                                padding: '12px 16px',
                                border: '2px solid ' + (optimizationGoal === 'max' ? '#2e186a' : '#e2e8f0'),
                                borderRadius: 8,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: optimizationGoal === 'max' ? '#f5f3ff' : 'white'
                            }}
                            onClick={() => setOptimizationGoal('max')}
                        >
                            <input type="radio" checked={optimizationGoal === 'max'} readOnly style={{ marginRight: 10 }} />
                            <strong>Maximizar Beneficios</strong> <span style={{ color: '#718096' }}>(ej. Optimizar ganancias)</span>
                        </div>
                    </div>
                    <p style={{ color: '#718096', fontSize: '0.8rem', marginTop: '1rem', marginBottom: 0 }}>
                        Nota: El método North West Corner encuentra una solución inicial factible.
                        Para optimización se recomienda usar métodos como MODI o Stepping Stone.
                    </p>
                </div>
            </Modal>
        </Wrap>
    );
};

export default NorthwestPage;