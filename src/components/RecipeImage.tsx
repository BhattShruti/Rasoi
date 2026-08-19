import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { resolveRecipeImage, resolveFallbackImage, isTrustedLocalUrl } from '../utils/imageResolver';

interface RecipeImageProps {
  alt: string;
  className?: string;
  imageUrl?: string;    // Retained for backward-compatibility — not used for src
  imagePrompt?: string; // Retained for backward-compatibility — not used for src
}

/**
 * Production Recipe Image component.
 *
 * Resolution flow:
 *   1. resolveRecipeImage(alt)  — scored catalog lookup from title
 *   2. On load error → resolveFallbackImage(alt)
 *   3. Never retries a broken URL (usedFallback guard prevents infinite loops)
 *
 * UX behaviour:
 *   - Skeleton shown until image loads (prevents layout shift)
 *   - Smooth fade-in on load
 *   - Vignette overlay for depth
 *   - lazy loading for performance
 */
export const RecipeImage: React.FC<RecipeImageProps> = ({ alt, imageUrl, className = '' }) => {
  const getInitialSrc = () => {
    if (isTrustedLocalUrl(imageUrl)) return imageUrl as string;
    return resolveRecipeImage(alt);
  };

  const [imgSrc, setImgSrc] = useState<string>(getInitialSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  // When the recipe title or resolved image URL changes,
  // reset component state so the new image is rendered cleanly.
  useEffect(() => {
    const nextSrc = isTrustedLocalUrl(imageUrl) ? (imageUrl as string) : resolveRecipeImage(alt);
    setImgSrc(nextSrc);
    setIsLoading(true);
    setUsedFallback(false);
  }, [alt, imageUrl]);

  const handleError = () => {
    // Guard: only attempt fallback ONCE to prevent infinite onError loops
    if (!usedFallback) {
      setUsedFallback(true);
      setImgSrc(resolveFallbackImage(alt));
    } else {
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden bg-[#f5f0e8] flex items-center justify-center ${className}`}>
      {/* Actual image — hidden until loaded to prevent flash of broken img */}
      <img
        key={`${alt}-${imgSrc}`} // key change forces React to remount img, resetting load state
        src={imgSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        className={`w-full h-full object-cover transition-all duration-500 ease-out absolute inset-0 ${
          isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
        }`}
      />

      {/* Skeleton shown while image is loading — prevents layout shift */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#f5f0e8] flex items-center justify-center animate-pulse">
          <ImageIcon className="w-6 h-6 text-[#c0b9a8]" />
        </div>
      )}

      {/* Vignette depth overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none z-10" />
    </div>
  );
};
