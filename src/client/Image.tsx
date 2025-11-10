import React, { ImgHTMLAttributes, useState, useEffect } from 'react';

interface ImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  quality?: number;
  sizes?: string;
  priority?: boolean;
}

export function Image({
  src,
  alt,
  width,
  height,
  lazy = true,
  quality = 75,
  sizes,
  priority = false,
  className = '',
  style = {},
  ...props
}: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  useEffect(() => {
    // Generate optimized image URL (placeholder for actual implementation)
    // In production, this would call an image optimization service
    const optimizedSrc = `${src}?q=${quality}${width ? `&w=${width}` : ''}${height ? `&h=${height}` : ''}`;
    setCurrentSrc(optimizedSrc);
  }, [src, quality, width, height]);

  const imageStyles: React.CSSProperties = {
    ...style,
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    ...(width && { width }),
    ...(height && { height }),
  };
 

  return (
    <img
      src={currentSrc || src}
      alt={alt}
      width={width}
      height={height}
      loading={lazy && !priority ? 'lazy' : 'eager'}
      decoding={priority ? 'sync' : 'async'}
      onLoad={() => setIsLoaded(true)}
      className={className}
      style={imageStyles}
      sizes={sizes}
      {...props}
    />
  );
}
