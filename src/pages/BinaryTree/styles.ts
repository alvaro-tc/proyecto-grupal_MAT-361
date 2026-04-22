import styled, { keyframes } from "styled-components";

export const PageContainer = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 60px);
  gap: 1.5rem;
  background: #f7f8fc;
`;

export const MainLayout = styled.div`
  display: flex;
  gap: 1.5rem;
  flex: 1;
  align-items: stretch;
  min-height: 0;
`;

export const CanvasWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const CanvasSVG = styled.svg`
  width: 100%;
  flex: 1;
  min-height: 600px;
  background-color: white;
  background-image: radial-gradient(#ccc 1px, transparent 1px);
  background-size: 20px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 2px solid #e8e8e8;
  overflow: visible;
`;

export const RightPanel = styled.div`
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const CardTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #2e186a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const TabRow = styled.div`
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #f0f2f5;
  padding-bottom: 0.5rem;
`;

export const Tab = styled.button<{ active?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ active }) => (active ? '#2e186a' : '#a0aec0')};
  background: ${({ active }) => (active ? 'rgba(46, 24, 106, 0.08)' : 'transparent')};
  transition: all 0.2s;
  &:hover {
    color: #2e186a;
    background: rgba(46, 24, 106, 0.05);
  }
`;

export const InputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

export const StyledInput = styled.input`
  flex: 1;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: #2d3748;
  outline: none;
  transition: all 0.2s;
  &:focus {
    border-color: #2e186a;
    box-shadow: 0 0 0 2px rgba(46, 24, 106, 0.1);
  }
  &::placeholder {
    color: #cbd5e0;
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
`;

export const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  border: none;
  cursor: pointer;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
  white-space: nowrap;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
  }

  ${({ variant = 'primary' }) => {
    switch (variant) {
      case 'primary':
        return `
          background: #2e186a;
          color: white;
          &:hover:not(:disabled) { background: #3d2490; box-shadow: 0 4px 14px rgba(46,24,106,0.35); }
        `;
      case 'secondary':
        return `
          background: #f0f2f5;
          color: #4a5568;
          &:hover:not(:disabled) { background: #e2e8f0; }
        `;
      case 'danger':
        return `
          background: #fff5f5;
          color: #f5222d;
          border: 1px solid #ffa39e;
          &:hover:not(:disabled) { background: #ffccc7; }
        `;
      case 'success':
        return `
          background: #f0fff4;
          color: #38a169;
          border: 1px solid #9ae6b4;
          &:hover:not(:disabled) { background: #c6f6d5; }
        `;
      default:
        return '';
    }
  }}
`;

export const TraversalDot = styled.circle<{ active?: boolean; traversalColor: string }>`
  fill: ${({ traversalColor }) => traversalColor};
  opacity: ${({ active }) => (active ? 1 : 0.25)};
  transition: all 0.25s ease;
  ${({ active }) => active && `animation: ${pulse} 0.5s ease;`}
`;

export const NodeCircle = styled.circle<{ highlighted?: boolean; color: string }>`
  fill: ${({ color }) => color};
  stroke: ${({ highlighted }) => (highlighted ? '#fff' : 'transparent')};
  stroke-width: ${({ highlighted }) => (highlighted ? '3' : '0')};
  filter: ${({ highlighted }) => highlighted ? 'drop-shadow(0 0 8px rgba(46,24,106,0.7))' : 'none'};
  transition: all 0.3s ease;
`;

export const TraversalLegend = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #4a5568;
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
`;

export const LegendDot = styled.span<{ color: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;

export const TraversalSequence = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.75rem;
  background: #f7f8fc;
  border-radius: 10px;
  min-height: 40px;
  border: 1px solid #e2e8f0;
`;

export const SeqItem = styled.span<{ active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.3s ease;
  background: ${({ active }) => active ? '#2e186a' : '#e2e8f0'};
  color: ${({ active }) => active ? 'white' : '#4a5568'};
  transform: ${({ active }) => active ? 'scale(1.2)' : 'scale(1)'};
  box-shadow: ${({ active }) => active ? '0 4px 12px rgba(46,24,106,0.3)' : 'none'};
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

export const ModalCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  width: 360px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #2e186a;
  text-align: center;
`;

export const FormLabel = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: #4a5568;
  display: block;
  margin-bottom: 0.35rem;
`;

export const NumberInput = styled.input`
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: #2d3748;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s;
  &:focus {
    border-color: #2e186a;
    box-shadow: 0 0 0 2px rgba(46, 24, 106, 0.1);
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  gap: 1rem;
  color: #a0aec0;
  font-size: 0.95rem;
  user-select: none;
`;

export const PageTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: #2e186a;
    background: linear-gradient(135deg, #2e186a, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  span.subtitle {
    font-size: 0.85rem;
    color: #a0aec0;
    font-weight: 400;
  }
`;
