import { SvgIconProps } from "../types";

export const SvgIcon = ({ src, width, height }: SvgIconProps) => {
  const path = src.includes("/") || src.startsWith("http") ? src : `/img/svg/${src}`;
  return <img src={path} alt={src} width={width} height={height} />;
};
