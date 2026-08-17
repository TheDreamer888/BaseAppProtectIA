import { useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const addUser = () => {
    if (!name || !email) return;
    const newUser = { id: Date.now(), name, email };
    setUsers(prev => [...prev, newUser]);
    setName("");
    setEmail("");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Utilizadores</h1>
      <ul>
        {users.map(u => (
          <li key={u.id}>
            <span>{u.name}</span> — <span>{u.email}</span>
          </li>
        ))}
      </ul>

      <h2>Adicionar novo</h2>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nome"
      />
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button onClick={addUser}>Guardar</button>
    </div>
  );
}

export default App;

