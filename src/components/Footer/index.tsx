import { Row } from "antd";
import { withTranslation, TFunction } from "react-i18next";
import { SvgIcon } from "../../common/SvgIcon";
import Container from "../../common/Container";

import {
  FooterSection,
  NavLink,
  Extra,
  LogoContainer,
  LogoText,
  FooterContainer,
} from "./styles";

interface SocialLinkProps {
  href: string;
  src: string;
}

const Footer = ({ t }: { t: TFunction }) => {
  const SocialLink = ({ href, src }: SocialLinkProps) => {
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    return (
      <a
        href={href}
        target={href === "#" ? "_self" : "_blank"}
        rel="noopener noreferrer"
        key={src}
        aria-label={src}
        onClick={(e) => {
          if (href === "#") e.preventDefault();
        }}
      >
        <SvgIcon src={src} width="25px" height="25px" />
      </a>
    );
  };

  return (
    <>
      <FooterSection>
      </FooterSection>
      <Extra>
        <Container border={true}>
          <Row
            justify="space-between"
            align="middle"
            style={{ paddingTop: "3rem" }}
          >
            <NavLink to="/">
              <LogoContainer>
                <LogoText>Algoritmos</LogoText>
              </LogoContainer>
            </NavLink>
            <FooterContainer>
              <SocialLink
                href="https://github.com/alvaro-tc/pagina-algoritmos"
                src="github.svg"
              />
              <SocialLink
                href="#"
                src="twitter.svg"
              />
              <SocialLink
                href="#"
                src="linkedin.svg"
              />
              <SocialLink
                href="#"
                src="medium.svg"
              />
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                rel="noopener noreferrer"
              >
                <img
                  height="36"
                  style={{ border: 0, height: 36 }}
                  src="https://storage.ko-fi.com/cdn/kofi3.png?v=3"
                  alt="Buy Me a Coffee at ko-fi.com"
                />
              </a>
            </FooterContainer>
            <div style={{ flexBasis: "100%", textAlign: "center", marginTop: "1rem", color: "#2e186a", fontWeight: "bold" }}>
              Hecho por Alvaro Torrez Calle
            </div>
          </Row>
        </Container>
      </Extra>
    </>
  );
};

export default withTranslation()(Footer);
