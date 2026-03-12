# Análisis de Algoritmos

Este proyecto es una plataforma interactiva desarrollada para la materia de **Análisis de Algoritmos** de la **Universidad Católica Boliviana "San Pablo"**.

**Autor:** Alvaro Ariel Torrez Calle

## Descripción

La aplicación tiene como objetivo proporcionar herramientas visuales y educativas para el aprendizaje y análisis de algoritmos y estructuras de datos. Incluye una sección de videos educativos y un **Editor de Grafos** completo para experimentar con teoría de grafos.

## Características Principales

### 🎥 Sección Educativa
- Videos seleccionados sobre algoritmos fundamentales (BFS, DFS, Dijkstra, Merge Sort).
- Interfaz interactiva y moderna.

### 🕸️ Editor de Grafos
Una herramienta potente para crear, visualizar y manipular grafos directamente en el navegador.

#### Funcionalidades del Editor:
1.  **Modos de Interacción:**
    -   **Modo Creación:** Permite añadir nodos haciendo clic en el lienzo y conectar nodos seleccionándolos secuencialmente.
    -   **Modo Edición:** Permite arrastrar y soltar nodos para reorganizar el grafo visualmente.

2.  **Gestión de Conexiones (Aristas):**
    -   **Creación de Aristas:** Conecta nodos fácilmente.
    -   **Peso de Aristas:** Asigna pesos o etiquetas a las conexiones para grafos ponderados.
    -   **Conexiones Bidireccionales:** Soporte para aristas curvas cuando existen conexiones en ambas direcciones entre dos nodos.
    -   **Auto-bucles (Self-loops):** Permite conectar un nodo consigo mismo.

3.  **Tipos de Grafos:**
    -   **Grafo Dirigido/No Dirigido:** Alterna entre grafos dirigidos y no dirigidos con un solo interruptor.
    -   **Conversión Inteligente:**
        -   Al cambiar a *Dirigido*, las conexiones existentes se duplican (ida y vuelta) automáticamente.
        -   Al cambiar a *No Dirigido*, las conexiones duplicadas se fusionan.

4.  **Personalización Avanzada:**
    -   **Menú Contextual:** Haz clic derecho en un nodo para editar sus propiedades.
    -   **Edición de Nodos:** Cambia el nombre (etiqueta) y el color de cada nodo individualmente.
    -   **Colores Automáticos:** Los nodos se generan con colores diversos para mejor distinción visual.

5.  **Utilidades:**
    -   **Cuadrícula (Grid):** Opción para mostrar una cuadrícula de fondo para facilitar la alineación.
    -   **Interfaz Intuitiva:** Paneles de control flotantes y modales para una experiencia de usuario fluida.

## Tecnologías Utilizadas

-   **React** (Frontend)
-   **TypeScript** (Tipado estático)
-   **Ant Design** (Componentes de UI)
-   **Styled Components** (Estilos CSS-in-JS)

---
*Proyecto realizado para la carrera de Ingeniería de Sistemas - UCB.*
