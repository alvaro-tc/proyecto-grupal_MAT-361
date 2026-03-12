import { Carousel } from "antd";
import styled from "styled-components";
import ReactPlayer from "react-player/lazy";

const SliderContainer = styled.div`
  padding: 4rem 1rem; // Added horizontal padding to prevent edge sticking
  background: #f9f9f9;
  
  .ant-carousel .slick-slide {
    text-align: center;
    background: transparent;
    overflow: hidden;
    padding: 1rem; // Spacing between slides
  }
  
  .ant-carousel .slick-dots li button {
    background: #2e186a !important;
  }
  
  .ant-carousel .slick-prev, .ant-carousel .slick-next {
    font-size: 20px;
    color: #2e186a;
    z-index: 10;
  }
  
  .ant-carousel .slick-prev {
    left: 10px;
  }
  
  .ant-carousel .slick-next {
    right: 10px;
  }

  h2 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2.5rem;
    color: #2e186a;
    font-family: 'Motiva Sans Bold', serif;
  }
`;

const SlideCard = styled.div`
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  overflow: hidden;
  margin: 0 auto;
  max-width: 100%; // Let it fill the slick-slide width
  display: flex !important;
  flex-direction: column;
  transition: transform 0.3s ease;
  height: 100%; // Uniform height

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
`;

const VideoWrapper = styled.div`
  width: 100%;
  height: 200px; // Smaller fixed height for better Multi-row look
  background: #000;
  position: relative;
    
  @media screen and (max-width: 768px) {
    height: 200px;
  }
`;

const InfoSection = styled.div`
  padding: 1.5rem;
  text-align: left;
  flex-grow: 1; // Fill remaining space
`;

const VideoTitle = styled.h3`
  font-size: 1.2rem;
  color: #2e186a;
  margin-bottom: 0.5rem;
  font-weight: bold;
  height: 3rem; // Fixed height for alignment
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const VideoDescription = styled.p`
  font-size: 0.95rem;
  color: #18216d;
  line-height: 1.5;
  height: 4.5rem; // Fixed height for alignment
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const videos = [
  {
    url: "https://www.youtube.com/watch?v=RBSGKlAvoiM",
    title: "1. Introducción a los Algoritmos",
    desc: "Descubre los fundamentos esenciales de la algoritmia y cómo se aplican en la resolución de problemas computacionales complejos."
  },
  {
    url: "https://www.youtube.com/watch?v=k1iC4k99eho",
    title: "2. Búsqueda en Anchura (BFS)",
    desc: "Aprende cómo funciona el algoritmo BFS para recorrer grafos nivel por nivel, ideal para encontrar caminos más cortos."
  },
  {
    url: "https://www.youtube.com/watch?v=4Zq2Fnd6tl0",
    title: "3. Búsqueda en Profundidad (DFS)",
    desc: "Explora la técnica DFS, fundamental para recorrer estructuras de datos, detectar ciclos y resolver problemas de conectividad."
  },
  {
    url: "https://www.youtube.com/watch?v=gazC-K4ksiQ",
    title: "4. Algoritmo de Dijkstra",
    desc: "Domina el algoritmo de Dijkstra para encontrar la ruta más eficiente entre nodos en un grafo con pesos positivos."
  },
  {
    url: "https://www.youtube.com/watch?v=JSceec-wEyw",
    title: "5. Merge Sort (Ordenamiento por Mezcla)",
    desc: "Visualiza y entiende el algoritmo de ordenamiento 'Divide y Vencerás' más eficiente y estable: Merge Sort."
  }
];

const ArrowButton = styled.div`
  width: 40px;
  height: 40px;
  background: #2e186a;
  border-radius: 50%;
  display: flex !important; // override slick-arrow default
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  transition: all 0.3s ease;

  &:hover {
    background: #ff825c;
    transform: translateY(-50%) scale(1.1);
  }

  &::before {
    display: none; // remove default slick arrow content
  }

  svg {
    width: 20px;
    height: 20px;
    fill: #fff;
  }
`;

const CustomNextArrow = (props: any) => {
  const { className, style, onClick } = props;
  return (
    <ArrowButton
      className={className}
      style={{ ...style, right: "-50px" }}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
      </svg>
    </ArrowButton>
  );
};

const CustomPrevArrow = (props: any) => {
  const { className, style, onClick } = props;
  return (
    <ArrowButton
      className={className}
      style={{ ...style, left: "-50px" }}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24">
        <path d="M15.41 7.41L10.83 12l4.58 4.59L14 18l-6-6 6-6 1.41 1.41z" />
      </svg>
    </ArrowButton>
  );
};

const VideoSlider = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 3,
    autoplay: true,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1
        }
      }
    ]
  };

  return (
    <SliderContainer id="videos">
      <h2>Videos Relacionados</h2>
      <Carousel {...settings}>
        {videos.map((vid, idx) => (
          <div key={idx}>
            <SlideCard>
              <VideoWrapper>
                <ReactPlayer
                  url={vid.url}
                  width="100%"
                  height="100%"
                  controls={true}
                  light={true}
                />
              </VideoWrapper>
              <InfoSection>
                <VideoTitle title={vid.title}>{vid.title}</VideoTitle>
                <VideoDescription>{vid.desc}</VideoDescription>
              </InfoSection>
            </SlideCard>
          </div>
        ))}
      </Carousel>
    </SliderContainer>
  );
};

export default VideoSlider;
