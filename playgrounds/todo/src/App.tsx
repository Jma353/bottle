import { Collection } from 'bottle';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

type Todo = { id: string; text: string; done: boolean };

const todos = new Collection<Todo>();

export const App = observer(() => {
  const [text, setText] = useState('');
  const all = todos.all;

  const handleAdd = () => {
    if (!text.trim()) {
      return;
    }
    todos.create({ entity: { id: crypto.randomUUID(), text, done: false } });
    setText('');
  };

  return (
    <div>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="New todo"
      />
      <button onClick={handleAdd}>Add</button>
      <ul>
        {all.map(todo => (
          <li key={todo.id}>
            <span
              style={{ textDecoration: todo.done ? 'line-through' : 'none' }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => {
                todos.update({ id: todo.id, patch: { done: !todo.done } });
              }}
            >
              Toggle
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});
