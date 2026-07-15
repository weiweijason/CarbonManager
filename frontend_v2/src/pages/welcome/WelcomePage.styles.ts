// WelcomePage.styles.ts
import styled from "styled-components";

export const Bg = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(160deg, #d8edd8 0%, #e9f0e6 60%, #eef4ec 100%);
  padding: 20px;
  box-sizing: border-box;
`;

export const Card = styled.section`
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  text-align: center;
  padding: 28px 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 400px) {
    padding: 20px 18px 24px;
  }
`;

export const Hero = styled.img`
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--radius);
  object-fit: cover;
  max-height: 220px;
`;

export const Title = styled.h1`
  font-size: clamp(22px, 5vw, 30px);
  margin: 4px 0 0;
  color: var(--accent-ink);
  font-weight: 800;
  letter-spacing: 0.5px;
`;

export const Subtitle = styled.p`
  margin: 0 auto;
  font-size: 17px;
  color: var(--muted);
  line-height: 1.7;
  max-width: 52ch;
`;

export const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 4px 0;

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;

export const FooterHint = styled.footer`
  margin-top: 4px;
  font-size: 14px;
  color: #8a9b86;
`;
