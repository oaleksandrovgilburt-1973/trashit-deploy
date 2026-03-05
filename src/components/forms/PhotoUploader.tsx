'use client';

import { useState, useCallback } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { uploadRequestPhoto, deleteRequestPhoto, getPhotoPath } from '@/lib/storage';

interface PhotoUploaderProps {
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  maxFileSize?: number; // in MB
}

export default function PhotoUploader({
  onPhotosChange,
  maxPhotos = 5,
  maxFileSize = 10,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    setError(null);

    // Validate file count
    if (photos.length + files.length > maxPhotos) {
      setError(`Можете да качите максимум ${maxPhotos} снимки`);
      return;
    }

    // Validate file sizes and types
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Само изображения са разрешени');
        return;
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        setError(`Всяка снимка трябва да е по-малка от ${maxFileSize}MB`);
        return;
      }
    }

    setUploading(true);

    try {
      // Generate a temporary request ID for uploads
      // In a real scenario, this would be the actual request ID after creation
      const tempRequestId = `temp-${Date.now()}`;

      const uploadPromises = files.map((file) =>
        uploadRequestPhoto(file, tempRequestId)
      );

      const uploadedUrls = await Promise.all(uploadPromises);
      const newPhotos = [...photos, ...uploadedUrls];

      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Грешка при качване на снимка'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (index: number) => {
    try {
      const photoUrl = photos[index];
      const photoPath = getPhotoPath(photoUrl);

      // Delete from storage
      await deleteRequestPhoto(photoPath);

      // Update local state
      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Грешка при изтриване на снимка'
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Снимки ({photos.length}/{maxPhotos})
        </label>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-green-500 transition cursor-pointer"
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          disabled={uploading || photos.length >= maxPhotos}
          className="hidden"
          id="photo-input"
        />

        <label htmlFor="photo-input" className="cursor-pointer">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {uploading
              ? 'Качване на снимки...'
              : 'Превлачете снимки тук или кликнете за избор'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Максимум {maxFileSize}MB на снимка
          </p>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              <img
                src={photo}
                alt={`Снимка ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <button
                onClick={() => handleRemovePhoto(index)}
                disabled={uploading}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
