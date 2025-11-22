import React, { useRef, useEffect } from 'react';
import { X, Check, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCrop, onCancel }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<any>(null);

  useEffect(() => {
    const initCropper = () => {
        if (imageRef.current && (window as any).Cropper) {
            cropperRef.current = new (window as any).Cropper(imageRef.current, {
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 0.9,
                restore: false,
                modal: true,
                guides: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                background: false, // Clean look
            });
        }
    };
    
    // Small delay to ensure DOM is ready and transition is done
    const timer = setTimeout(initCropper, 100);

    return () => {
      clearTimeout(timer);
      cropperRef.current?.destroy();
    };
  }, [imageSrc]);

  const handleCrop = () => {
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCroppedCanvas();
      if (canvas) {
        // Convert to jpeg to save space
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCrop(croppedDataUrl);
      }
    }
  };

  const handleRotate = () => {
    cropperRef.current?.rotate(90);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <h3 className="text-white font-medium text-lg shadow-sm">Crop Image</h3>
        <button 
            onClick={onCancel}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
        >
            <X size={20} />
        </button>
      </div>

      {/* Cropper Container */}
      <div className="w-full h-[70vh] md:h-[80vh] bg-black flex items-center justify-center overflow-hidden">
         <img 
            ref={imageRef} 
            src={imageSrc} 
            alt="Crop" 
            className="max-w-full max-h-full block" 
            style={{ opacity: 0 }} // Hide initial flash until cropper loads
         />
      </div>
      
      {/* Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 flex items-center justify-center gap-8 pb-8">
        
        <button 
            onClick={onCancel} 
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition"
        >
          <div className="p-3 rounded-full border border-gray-600 hover:border-gray-400 hover:bg-gray-800">
            <X size={24} />
          </div>
          <span className="text-xs">Skip</span>
        </button>

        <button 
            onClick={handleRotate} 
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition"
        >
          <div className="p-3 rounded-full border border-gray-600 hover:border-gray-400 hover:bg-gray-800">
            <RotateCw size={24} />
          </div>
          <span className="text-xs">Rotate</span>
        </button>

        <button 
            onClick={handleCrop} 
            className="flex flex-col items-center gap-1 text-brand-400 hover:text-brand-300 transition"
        >
          <div className="p-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20">
            <Check size={24} />
          </div>
          <span className="text-xs font-semibold">Done</span>
        </button>

      </div>
    </div>
  );
};

export default ImageCropper;