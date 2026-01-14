import { useState, useRef, type ChangeEvent } from 'react';
import './ImageUpload.css';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (files: File[]) => void;
}

function ImageUpload({ images, onImagesChange }: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const allFiles = [...images, ...newFiles];

    onImagesChange(allFiles);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    onImagesChange(newImages);
    setPreviews(newPreviews);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const allFiles = [...images, ...newFiles];

    onImagesChange(allFiles);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="image-upload-section">
      <label className="section-label">E-Waste Images</label>
      <p className="section-description">Upload images of the e-waste for better analysis</p>

      <div
        className="dropzone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-content">
          <svg
            className="upload-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="dropzone-text">
            Click to upload or drag and drop
          </p>
          <p className="dropzone-hint">PNG, JPG, JPEG up to 10MB each</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="file-input"
        />
      </div>

      {previews.length > 0 && (
        <div className="image-previews">
          {previews.map((preview, index) => (
            <div key={index} className="preview-item">
              <img src={preview} alt={`Preview ${index + 1}`} className="preview-image" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(index);
                }}
                className="remove-button"
                aria-label="Remove image"
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
