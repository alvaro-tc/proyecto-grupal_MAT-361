import styled from "styled-components";
// Button import removed

export const GraphContainer = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 60px); /* Fill screen minus header approx */
`;

export const CanvasContainer = styled.div`
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const ControlPanel = styled.div`
  margin-bottom: 2rem;
  display: flex;
  gap: 2rem;
  align-items: center;
  background: #f0f2f5;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

export const Canvas = styled.div<{ mode: 'creation' | 'editing'; showGrid: boolean }>`
  width: 100%;
  flex: 1;
  min-height: 700px;
  background-color: white;
  background-image: ${({ showGrid }) =>
    showGrid
      ? "radial-gradient(#ccc 1px, transparent 1px)"
      : "none"};
  background-size: 20px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  cursor: ${({ mode }) => (mode === 'creation' ? "crosshair" : "default")};
  border: 2px solid ${({ mode }) => (mode === 'editing' ? "#1890ff" : "#e8e8e8")};
  transition: border-color 0.3s;
  touch-action: none;
  flex: 1;
  min-width: 0;
`;

export const FloatingPanel = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  padding: ${({ visible }) => (visible ? '0.65rem 1.25rem' : '0')};
  max-width: ${({ visible }) => (visible ? '600px' : '0')};
  overflow: hidden;
  border-radius: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
`;

export const PanelToggle = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 20;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e186a;
  font-size: 16px;
  transition: all 0.2s;
  &:hover {
    background: #2e186a;
    color: white;
    box-shadow: 0 4px 14px rgba(46, 24, 106, 0.3);
  }
`;

export const Node = styled.div<{ x: number; y: number; isSelected: boolean; color: string }>`
  position: absolute;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y}px;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background: ${({ color }) => color};
  border: 3px solid ${({ isSelected }) => (isSelected ? "#fff" : "transparent")};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: white;
  box-shadow: ${({ isSelected, color }) =>
    isSelected
      ? `0 0 0 3px ${color}, 0 4px 12px rgba(0,0,0,0.3)`
      : `0 4px 8px rgba(0, 0, 0, 0.15)`
  };
  cursor: pointer;
  z-index: 2;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
  user-select: none;

  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: ${({ isSelected, color }) =>
    isSelected
      ? `0 0 0 3px ${color}, 0 6px 16px rgba(0,0,0,0.4)`
      : `0 6px 16px rgba(0, 0, 0, 0.2)`
  };
  }
`;

export const ContextMenuContainer = styled.div<{ x: number; y: number }>`
  position: fixed;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y}px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 8px;
  min-width: 140px;
  border: 1px solid rgba(255, 255, 255, 0.4);
`;

export const ContextMenuItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  color: #2d3748;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #edf2f7;
    color: #2e186a;
  }
`;

export const EdgeLabel = styled.div<{ x: number; y: number; mode: 'creation' | 'editing' }>`
  position: absolute;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y}px;
  transform: translate(-50%, -50%);
  background: white;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid #1890ff;
  font-size: 13px;
  font-weight: bold;
  color: #1890ff;
  pointer-events: ${({ mode }) => (mode === 'editing' ? 'auto' : 'none')};
  cursor: ${({ mode }) => (mode === 'editing' ? 'pointer' : 'default')};
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
  user-select: none;

  &:hover {
    ${({ mode }) => mode === 'editing' && `
      background: #e6f7ff;
      transform: translate(-50%, -50%) scale(1.1);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `}
  }
`;

export const StyledModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 0;
  
  label {
    font-weight: 500;
    color: #4a5568;
    font-size: 0.95rem;
    margin-bottom: 6px;
    display: block;
  }

  .ant-input, .ant-input-number {
    border-radius: 8px;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    box-shadow: none;
    transition: all 0.2s;
    
    &:focus, &:hover {
      border-color: #2e186a;
      box-shadow: 0 0 0 2px rgba(46, 24, 106, 0.1);
    }
  }

  .ant-input-number-input {
    padding: 0;
  }
`;

export const MainLayout = styled.div`
  display: flex;
  width: 100%;
  gap: 2rem;
  align-items: flex-start;
  max-width: 1400px;
  margin: 0 auto;
`;

export const Sidebar = styled.div<{ visible: boolean }>`
  width: ${({ visible }) => (visible ? '300px' : '0')};
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  
  .sidebar-content {
    padding: 1.5rem;
    width: 300px; /* Fixed width to prevent text reflow during animation */
  }

  h3 {
    color: #2e186a;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h4 {
    color: #4a5568;
    font-size: 0.95rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem 0;
  }

  ul {
    padding-left: 1.2rem;
    margin: 0;
    color: #4a5568;
    font-size: 0.9rem;
    line-height: 1.6;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
`;

