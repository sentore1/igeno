interface SvgProps extends React.SVGProps<SVGSVGElement> {
  height?: number;
  width?: number;
}

export function Hulu({ height = 24, width = 24, ...props }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M14.5 0c-2.206 0-4 1.794-4 4v16c0 2.206 1.794 4 4 4h5.5c2.206 0 4-1.794 4-4V4c0-2.206-1.794-4-4-4h-5.5zM0 4v16c0 2.206 1.794 4 4 4h2c2.206 0 4-1.794 4-4V4c0-2.206-1.794-4-4-4H4C1.794 0 0 1.794 0 4z"/>
    </svg>
  );
}
