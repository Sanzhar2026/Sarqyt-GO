// app/components/AvatarCropper.tsx
'use client';

import { useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface AvatarCropperProps {
  imageFile: File;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function AvatarCropper({ imageFile, onCropComplete, onCancel }: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Загружаем изображение
useEffect(() => {
  const url = URL.createObjectURL(imageFile);
  setImageUrl(url);
  return () => URL.revokeObjectURL(url);
}, [imageFile]);

  const onCropCompleteHandler = (croppedArea: any, croppedAreaPixelsData: any) => {
    setCroppedAreaPixels(croppedAreaPixelsData);
  };

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    const image = new Image();
    image.src = imageUrl;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем размер 200x200 для аватара
    canvas.width = 200;
    canvas.height = 200;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x * scaleX,
      croppedAreaPixels.y * scaleY,
      croppedAreaPixels.width * scaleX,
      croppedAreaPixels.height * scaleY,
      0,
      0,
      200,
      200
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      'image/webp',
      0.9
    );
  };

  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Обрежьте аватар</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="relative h-80 bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteHandler}
            cropShape="round"
            showGrid={false}
          />
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="mb-4">
            <label className="text-sm text-gray-600 block mb-2">Масштаб</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={createCroppedImage}
              className="flex-1 bg-[#367666] text-white py-2 rounded-lg font-medium hover:bg-[#2a5a4d] flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}