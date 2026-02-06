import React from 'react';

interface ViewportProps {
  image: string | null;
  isLoading: boolean;
  labels: {
    void: string;
    etching: string;
  };
}

const Viewport: React.FC<ViewportProps> = ({ image, isLoading, labels }) => {
  return (
    <div className="relative w-full aspect-square md:aspect-auto md:h-[60%] bg-stone-900 overflow-hidden border-b-4 border-double border-stone-700 relative group">
      {/* Decorative inner border */}
      <div className="absolute inset-2 border border-stone-600 z-20 pointer-events-none opacity-50"></div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 bg-black/70 flex flex-col items-center justify-center animate-pulse">
           <span className="text-stone-500 gothic-text tracking-widest text-lg">{labels.etching}</span>
        </div>
      )}

      {/* Image Display */}
      {image ? (
        <img 
          src={`data:image/png;base64,${image}`} 
          alt="Current Scene"
          className="w-full h-full object-cover shadow-inner"
          style={{ 
            imageRendering: 'pixelated',
            filter: 'grayscale(100%) contrast(140%) brightness(85%) sepia(20%)' 
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <span className="text-stone-800 gothic-text text-4xl opacity-20 select-none">{labels.void}</span>
        </div>
      )}
      
      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] z-10 pointer-events-none"></div>
    </div>
  );
};

export default Viewport;