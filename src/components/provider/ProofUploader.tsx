'use client';

import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProofUploaderProps {
  requestId: string;
  maxPhotos?: number;
  maxSizePerPhoto?: number; // in MB
  onPhotosChange?: (photoUrls: string[]) => void;
}

export default function ProofUploader({
  requestId,
  maxPhotos = 5,
  maxSizePerPhoto = 10,
  onPhotosChange,
}: ProofUploaderProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    if (!files.length) return;

    setError(null);
    setSuccess(false);

    // Check if adding these files would exceed max
    if (photos.length + files.length > maxPhotos) {
      setError(
        `Можете да качите максимум ${maxPhotos} снимки. Вече имате ${photos.length}.`
      );
      return;
    }

    setUploading(true);

    try {
      const newPhotoUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Моля, качете само изображения');
          setUploading(false);
          return;
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizePerPhoto) {
          setError(
            `Файлът е твърде голям. Максимум ${maxSizePerPhoto}MB на снимка.`
          );
          setUploading(false);
          return;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}-${random}.${ext}`;
        const path = `request-proofs/${requestId}/${filename}`;

        // Upload to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('request-proofs')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          setError(`Грешка при качване: ${uploadError.message}`);
          setUploading(false);
          return;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('request-proofs').getPublicUrl(path);

        newPhotoUrls.push(publicUrl);
      }

      // Update state
      const allPhotos = [...photos, ...newPhotoUrls];
      setPhotos(allPhotos);
      setSuccess(true);

      // Notify parent component
      if (onPhotosChange) {
        onPhotosChange(allPhotos);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Грешка при качване на снимката'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    try {
      // Extract path from URL
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf('request-proofs');
      const path = pathParts.slice(bucketIndex + 1).join('/');

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('request-proofs')
        .remove([path]);

      if (deleteError) {
        setError(`Грешка при изтриване: ${deleteError.message}`);
        return;
      }

      // Update state
      const updatedPhotos = photos.filter((p) => p !== photoUrl);
      setPhotos(updatedPhotos);

      // Notify parent component
      if (onPhotosChange) {
        onPhotosChange(updatedPhotos);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Грешка при изтриване на снимката'
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Снимки на завършена работа
        </label>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Качете минимум 1 снимка (максимум {maxPhotos}, по {maxSizePerPhoto}MB всяка)
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600 dark:text-green-400">
              Снимката е качена успешно
            </p>
          </div>
        )}

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-green-500 dark:hover:border-green-400 transition cursor-pointer bg-gray-50 dark:bg-gray-800/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Плъгнете снимки тук или кликнете
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            PNG, JPG, GIF до {maxSizePerPhoto}MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files!)}
            disabled={uploading}
            className="hidden"
          />
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Качени снимки ({photos.length}/{maxPhotos})
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photoUrl, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-square"
              >
                <img
                  src={photoUrl}
                  alt={`Proof ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemovePhoto(photoUrl)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length === 0 && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Трябва да качите поне 1 снимка преди да завършите
          </p>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Качване на снимката...
          </p>
        </div>
      )}
    </div>
  );
}
