'use client';
import React from 'react';
interface Props {
  users: Array<{ id: string; role: string }>;
  onSelect: (id: string) => void;
}
export function AdminUsers({ users, onSelect }: Props) {
  return (
    <section aria-label="User administration">
      <h2>Users</h2>
      {users.length === 0 ? (
        <p>No users</p>
      ) : (
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              <button onClick={() => onSelect(u.id)}>
                {u.id} ({u.role})
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
