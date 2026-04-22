import { useState, useEffect } from "react";

function App() {
  const [input, setInput] = useState("");
  const [numbers, setNumbers] = useState([]);
  const [name, setName] = useState("Nombre del archivo");
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const addNumber = () => {
    if (input === "") return;
    setNumbers([...numbers, parseInt(input)]);
    setInput("");
  };

  const deleteNumber = (index) => {
    setNumbers(numbers.filter((_, i) => i !== index));
  };

  const editNumber = (index) => {
    const newValue = prompt("Nuevo valor:", numbers[index]);
    if (newValue !== null && newValue !== "") {
      const updated = [...numbers];
      updated[index] = parseInt(newValue);
      setNumbers(updated);
    }
  };

  const clearAll = () => {
    setNumbers([]);
    setSteps([]);
    setCurrentStep(0);
    setPlaying(false);
  };

  // 🔹 MERGE SORT
  const mergeSort = (array, stepsLog = []) => {
    if (array.length <= 1) return array;

    const mid = Math.floor(array.length / 2);
    const left = array.slice(0, mid);
    const right = array.slice(mid);

    stepsLog.push({ type: "divide", data: [left, right] });

    const sortedLeft = mergeSort(left, stepsLog);
    const sortedRight = mergeSort(right, stepsLog);

    const merged = merge(sortedLeft, sortedRight, stepsLog);

    return merged;
  };

  const merge = (left, right, stepsLog) => {
    let result = [];
    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
      if (left[i] < right[j]) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }

    result = result.concat(left.slice(i)).concat(right.slice(j));

    stepsLog.push({ type: "merge", data: result });

    return result;
  };

  const runMergeSort = () => {
    if (numbers.length < 2) {
      alert("Agrega al menos 2 números");
      return;
    }

    let stepsLog = [];
    mergeSort(numbers, stepsLog);

    setSteps(stepsLog);
    setCurrentStep(0);
    setPlaying(false);
  };

  // 🔹 AUTO PLAY
  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [playing, steps]);

  // 🔹 EXPORTAR JSON
  const exportJSON = () => {
    const data = {
      name,
      numbers,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "merge-sort"}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  // 🔹 IMPORTAR JSON
  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.numbers && Array.isArray(data.numbers)) {
          setNumbers(data.numbers);
          setName(data.name || "Lista importada");
          setSteps([]);
          setCurrentStep(0);
          setPlaying(false);
        } else {
          alert("Archivo inválido");
        }
      } catch {
        alert("Error al leer el archivo");
      }
    };

    reader.readAsText(file);
  };

  // 🔹 TEXTO EXPLICATIVO
  const getStepExplanation = (step) => {
    if (!step) return "";

    if (step.type === "divide") {
      return `Se divide el arreglo en: ${JSON.stringify(step.data)}`;
    }

    if (step.type === "merge") {
      return `Se combinan los elementos para formar: [${step.data.join(", ")}]`;
    }

    return "";
  };

  // 🔹 BARRAS
  const renderBars = (array) => {
    return (
      <div style={styles.barContainer}>
        {array.map((num, i) => (
          <div key={i} style={styles.barWrapper}>
            <div
              style={{
                ...styles.bar,
                height: `${num * 10}px`,
              }}
            ></div>
            <span>{num}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Merge Sort Visual</h1>

      <input
        style={styles.input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la lista"
      />

      <div style={styles.row}>
        <input
          style={styles.input}
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Número"
        />
        <button style={styles.addBtn} onClick={addNumber}>
          Agregar
        </button>
      </div>

      <button style={styles.clearBtn} onClick={clearAll}>
        Borrar todo
      </button>

      <button style={styles.addBtn} onClick={runMergeSort}>
        Ejecutar Merge Sort
      </button>

      {/* CONTROLES */}
      <div>
        <button style={styles.addBtn} onClick={() => setPlaying(true)}>
          ▶ Play
        </button>
        <button style={styles.clearBtn} onClick={() => setPlaying(false)}>
          ⏸ Stop
        </button>
      </div>

      {/* EXPORT / IMPORT */}
      <div style={{ marginTop: "10px" }}>
        <button style={styles.addBtn} onClick={exportJSON}>
          💾 Exportar JSON
        </button>

        <label style={styles.addBtn}>
          📂 Importar JSON
          <input
            type="file"
            accept=".json"
            onChange={importJSON}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* VISUAL */}
      <h3>Estado actual</h3>
      {renderBars(numbers)}

      {/* PASOS */}
      {steps.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>
            Paso {currentStep + 1} de {steps.length}
          </h3>

          <p><b>{steps[currentStep].type.toUpperCase()}</b></p>

          <p style={{ fontStyle: "italic" }}>
            {getStepExplanation(steps[currentStep])}
          </p>

          {Array.isArray(steps[currentStep].data[0]) ? (
            steps[currentStep].data.map((group, i) => (
              <div key={i}>{renderBars(group)}</div>
            ))
          ) : (
            renderBars(steps[currentStep].data)
          )}

          <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>
            Anterior
          </button>

          <button onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}>
            Siguiente
          </button>
        </div>
      )}

      {/* LISTA */}
      <div style={styles.list}>
        {numbers.map((num, index) => (
          <div key={index} style={styles.card}>
            <span onClick={() => editNumber(index)} style={styles.number}>
              {num}
            </span>
            <button style={styles.deleteBtn} onClick={() => deleteNumber(index)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    fontFamily: "Arial",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    marginBottom: "20px",
  },
  input: {
    padding: "10px",
    margin: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  row: {
    display: "flex",
    justifyContent: "center",
  },
  addBtn: {
    padding: "10px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "8px",
    margin: "5px",
    cursor: "pointer",
  },
  clearBtn: {
    padding: "10px",
    backgroundColor: "red",
    color: "white",
    border: "none",
    borderRadius: "8px",
    margin: "5px",
    cursor: "pointer",
  },
  list: {
    marginTop: "20px",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
  },
  card: {
    padding: "15px",
    borderRadius: "10px",
    background: "#eee",
    position: "relative",
  },
  number: {
    cursor: "pointer",
  },
  deleteBtn: {
    position: "absolute",
    top: "2px",
    right: "5px",
    border: "none",
    background: "transparent",
    color: "red",
    cursor: "pointer",
  },
  barContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: "10px",
    marginTop: "10px",
  },
  barWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  bar: {
    width: "30px",
    backgroundColor: "#4CAF50",
    borderRadius: "5px",
  },
};

export default App;

