import { useState } from "react";
import { Row, Col, Drawer, Dropdown, Menu as AntMenu } from "antd";
import { withTranslation, TFunction } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Container from "../../common/Container";
import {
  HeaderSection,
  LogoContainer,
  LogoText,
  Burger,
  NotHidden,
  Menu,
  CustomNavLinkSmall,
  Label,
  Outline,
  Span,
} from "./styles";

const Header = ({ t }: { t: TFunction }) => {
  const [visible, setVisibility] = useState(false);
  const history = useHistory();
  const { user, logout } = useAuth();

  const toggleButton = () => {
    setVisibility(!visible);
  };

  const MenuItem = () => {
    const scrollTo = (id: string) => {
      const element = document.getElementById(id) as HTMLDivElement;
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
        });
      } else {
        history.push("/");
        setTimeout(() => {
          const el = document.getElementById(id) as HTMLDivElement;
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
      setVisibility(false);
    };

    const scrollToTop = () => {
      if (window.location.pathname !== "/") {
        history.push("/");
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setVisibility(false);
    };
    return (
      <>
        <CustomNavLinkSmall onClick={scrollToTop}>
          <Span>{t("Inicio")}</Span>
        </CustomNavLinkSmall>
        <CustomNavLinkSmall onClick={() => scrollTo("videos")}>
          <Span>{t("Videos")}</Span>
        </CustomNavLinkSmall>
        <CustomNavLinkSmall>
          <Dropdown
            overlay={
              <AntMenu
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(46, 24, 106, 0.1)',
                  padding: '8px',
                  border: '1px solid #f0f2f5',
                }}
              >
                <AntMenu.Item
                  key="basic"
                  onClick={() => { history.push('/graphs'); setVisibility(false); }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontFamily: "'Motiva Sans Bold', serif",
                    color: '#2e186a',
                    marginBottom: '4px',
                    fontSize: '0.95rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>📊</span> Editor Básico
                </AntMenu.Item>
                <AntMenu.Item
                  key="matrix"
                  onClick={() => { history.push('/graphs-matrix'); setVisibility(false); }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontFamily: "'Motiva Sans Bold', serif",
                    color: '#2e186a',
                    fontSize: '0.95rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🔢</span> Editor con Matrices
                </AntMenu.Item>
              </AntMenu>
            }
            trigger={['hover']}
            placement="bottomCenter"
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%', padding: '0.5rem 0' }}>
              <Span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {t("Graphs")}
                <span style={{ fontSize: '0.7em', opacity: 0.7 }}>▼</span>
              </Span>
            </div>
          </Dropdown>
        </CustomNavLinkSmall>

        {/* Algoritmos dropdown */}
        <CustomNavLinkSmall>
          <Dropdown
            overlay={
              <AntMenu
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(46, 24, 106, 0.1)',
                  padding: '8px',
                  border: '1px solid #f0f2f5',
                }}
              >
                <AntMenu.Item
                  key="johnson"
                  onClick={() => { history.push('/algorithms/johnson'); setVisibility(false); }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontFamily: "'Motiva Sans Bold', serif",
                    color: '#2e186a',
                    fontSize: '0.95rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🔁</span> Johnson (CPM)
                </AntMenu.Item>
              </AntMenu>
            }
            trigger={['hover']}
            placement="bottomCenter"
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%', padding: '0.5rem 0' }}>
              <Span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {t("Algoritmos")}
                <span style={{ fontSize: '0.7em', opacity: 0.7 }}>▼</span>
              </Span>
            </div>
          </Dropdown>
        </CustomNavLinkSmall>

        {/* Auth nav */}
        <CustomNavLinkSmall onClick={() => scrollTo("contact")}>
          <Span>{t("Contact")}</Span>
        </CustomNavLinkSmall>
        {user ? (
          <>
            {/* Avatar with dropdown */}
            <CustomNavLinkSmall style={{ cursor: 'pointer' }}>
              <Dropdown
                overlay={
                  <AntMenu>
                    <AntMenu.Item key="name" disabled style={{ color: '#2e186a', fontWeight: 600, cursor: 'default' }}>
                      {user.name} {user.lastname}
                    </AntMenu.Item>
                    {user.role === 'admin' && (
                      <AntMenu.Item key="admin" onClick={() => { history.push('/admin'); setVisibility(false); }}>
                        🛡️ Panel Admin
                      </AntMenu.Item>
                    )}
                    <AntMenu.Divider />
                    <AntMenu.Item
                      key="logout"
                      danger
                      onClick={() => { logout(); history.push('/'); setVisibility(false); }}
                    >
                      Cerrar sesión
                    </AntMenu.Item>
                  </AntMenu>
                }
                trigger={['click']}
                placement="bottomRight"
              >
                <div
                  title={`${user.name} ${user.lastname}`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#2e186a',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Motiva Sans Bold', serif",
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: 1,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {(user.name?.[0] ?? '').toUpperCase()}{(user.lastname?.[0] ?? '').toUpperCase()}
                </div>
              </Dropdown>
            </CustomNavLinkSmall>
          </>
        ) : (
          <CustomNavLinkSmall onClick={() => history.push("/login")}>
            <Span>Login</Span>
          </CustomNavLinkSmall>
        )}
      </>
    );
  };

  return (
    <HeaderSection>
      <Container>
        <Row justify="space-between">
          <LogoContainer to="/" aria-label="homepage">
            <LogoText>Algoritmos</LogoText>
          </LogoContainer>
          <NotHidden>
            <MenuItem />
          </NotHidden>
          <Burger onClick={toggleButton}>
            <Outline />
          </Burger>
        </Row>
        <Drawer closable={false} open={visible} onClose={toggleButton}>
          <Col style={{ marginBottom: "2.5rem" }}>
            <Label onClick={toggleButton}>
              <Col span={12}>
                <Menu>Menu</Menu>
              </Col>
              <Col span={12}>
                <Outline />
              </Col>
            </Label>
          </Col>
          <MenuItem />
        </Drawer>
      </Container>
    </HeaderSection>
  );
};

export default withTranslation()(Header);
