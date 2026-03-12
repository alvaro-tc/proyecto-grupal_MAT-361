import { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth, API_URL } from '../../context/AuthContext';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; }`;

const Page = styled.div`
  min-height: 100vh;
  background: #f7f8fc;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 900px;
  margin: 0 auto 2rem;
`;

const Title = styled.h1`
  color: #2e186a;
  font-size: 1.75rem;
  font-weight: 700;
`;

const BackBtn = styled.button`
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 50px;
  padding: 0.5rem 1.2rem;
  font-weight: 600;
  color: #4a5568;
  cursor: pointer;
  &:hover { border-color: #2e186a; color: #2e186a; }
`;

const Table = styled.table`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  border-collapse: collapse;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  animation: ${fadeIn} 0.4s ease;
`;

const Th = styled.th`
  background: #2e186a;
  color: white;
  padding: 0.9rem 1.25rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;
  color: #4a5568;
`;

const Badge = styled.span<{ role: string }>`
  background: ${({ role }) => role === 'admin' ? '#f0e7ff' : '#e8f4fd'};
  color: ${({ role }) => role === 'admin' ? '#7c3aed' : '#1890ff'};
  padding: 0.2rem 0.7rem;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 600;
`;

const DeleteBtn = styled.button`
  background: #fff5f5;
  color: #e53e3e;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  padding: 0.3rem 0.8rem;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  &:hover { background: #e53e3e; color: white; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const EmptyMsg = styled.p`
  text-align: center;
  color: #a0aec0;
  padding: 2rem;
`;

interface User { id: string; email: string; role: string; created_at: string; }

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const history = useHistory();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setUsers(data); }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { history.push('/'); return; }
    fetchUsers();
  }, [user, fetchUsers, history]);

  const deleteUser = async (id: string) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setUsers(users.filter(u => u.id !== id));
  };

  return (
    <Page>
      <Header>
        <Title>🛡️ Panel de Administración</Title>
        <BackBtn onClick={() => history.push('/')}>← Volver</BackBtn>
      </Header>

      {loading ? (
        <EmptyMsg>Cargando usuarios...</EmptyMsg>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Correo</Th>
              <Th>Rol</Th>
              <Th>Registrado</Th>
              <Th>Acción</Th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <Td>{u.email}</Td>
                <Td><Badge role={u.role}>{u.role}</Badge></Td>
                <Td>{new Date(u.created_at).toLocaleDateString('es-BO')}</Td>
                <Td>
                  <DeleteBtn
                    onClick={() => deleteUser(u.id)}
                    disabled={u.id === user?.id || u.email === 'admin@admin.com'}
                  >
                    Eliminar
                  </DeleteBtn>
                </Td>
              </tr>
            ))}
            {users.length === 0 && <tr><Td colSpan={4}><EmptyMsg>No hay usuarios</EmptyMsg></Td></tr>}
          </tbody>
        </Table>
      )}
    </Page>
  );
};

export default AdminDashboard;
