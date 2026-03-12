import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styled from 'styled-components';
import { SvgIcon } from '../../common/SvgIcon';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 2rem 1rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 440px;
`;

const LogoWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
`;

const SiteName = styled.h6`
  font-family: 'Motiva Sans Bold', serif;
  font-size: 2rem !important;
  color: #2e186a;
  margin: 0.5rem 0 0 !important;
`;

const Title = styled.h3`
  font-family: 'Motiva Sans Bold', serif;
  font-size: 1.5rem !important;
  color: #18216d;
  text-align: center;
  margin-bottom: 0.25rem !important;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #8c8c8c;
  font-size: 0.95rem !important;
  margin-bottom: 1.75rem !important;
`;

const Row = styled.div`
  display: flex;
  gap: 0.75rem;
  > div { flex: 1; }
`;

const Label = styled.label`
  display: block;
  font-family: 'Motiva Sans Bold', serif;
  font-size: 0.85rem;
  color: #18216d;
  margin-bottom: 0.4rem;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.9rem 1.1rem;
  border-radius: 4px;
  border: 0;
  background: rgb(241, 242, 243);
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 1rem;
  font-family: 'Motiva Sans Light', sans-serif;
  transition: all 0.3s ease-in-out;
  &:focus {
    background: none;
    box-shadow: #2e186a 0px 0px 0px 1px;
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 0.85rem;
  background: #2e186a;
  color: white;
  border: none;
  border-radius: 4px;
  font-family: 'Motiva Sans Bold', serif;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
  &:hover { background: #18216d; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ErrorMsg = styled.p`
  color: #e53e3e;
  font-size: 0.85rem !important;
  text-align: center;
  margin-bottom: 1rem !important;
`;

const Footer = styled.p`
  text-align: center;
  margin-top: 1.25rem !important;
  color: #8c8c8c;
  font-size: 0.875rem !important;
  a {
    color: #2e186a;
    font-family: 'Motiva Sans Bold', serif;
    text-decoration: none;
    &:hover { color: #ff825c; }
  }
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  color: #8c8c8c;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 1.5rem;
  font-family: 'Motiva Sans Light', sans-serif;
  &:hover { color: #2e186a; }
`;

const Signup = () => {
  const { register } = useAuth();
  const history = useHistory();
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await register(email, password, name, lastname);
      history.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Card>
        <BackBtn onClick={() => history.push('/')}>← Volver al inicio</BackBtn>
        <LogoWrap>
          <SvgIcon src="logo.svg" width="64px" height="64px" />
          <SiteName>Algoritmos</SiteName>
        </LogoWrap>
        <Title>Crear Cuenta</Title>
        <Subtitle>Regístrate para guardar tus pizarras de grafos</Subtitle>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <form onSubmit={handleSubmit}>
          <Row>
            <div>
              <Label>Nombre</Label>
              <StyledInput placeholder="Juan" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Apellidos</Label>
              <StyledInput placeholder="Pérez García" value={lastname} onChange={e => setLastname(e.target.value)} required />
            </div>
          </Row>
          <Label>Correo electrónico</Label>
          <StyledInput type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <Label>Contraseña <span style={{ color: '#8c8c8c', fontFamily: 'Motiva Sans Light' }}>(mín. 4 caracteres)</span></Label>
          <StyledInput type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          <Label>Confirmar contraseña</Label>
          <StyledInput type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          <SubmitBtn type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Crear Cuenta'}</SubmitBtn>
        </form>
        <Footer>¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></Footer>
      </Card>
    </Page>
  );
};

export default Signup;
