import { useEffect, useState } from "react";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/api/hello")
      .then(res => res.json())
      .then(data => setMsg(data.text))
      .catch(err => console.error("Erro ao ligar ao backend:", err));
  }, []);

  return (
    <div>
      <h1>Frontend React + TS</h1>
      <p>Mensagem do backend: {msg}</p>
    </div>
  );
}

export default App;

