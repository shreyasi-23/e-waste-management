import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { EWasteData } from '../types';
import ImageUpload from './ImageUpload';
import './EWasteForm.css';

interface EWasteFormProps {
  onSubmit: (data: EWasteData) => void;
  isAnalyzing: boolean;
}

const eWasteTypes = [
  'Computers & Laptops',
  'Smartphones & Tablets',
  'Televisions & Monitors',
  'Printers & Scanners',
  'Gaming Consoles',
  'Batteries',
  'Circuit Boards',
  'Cables & Wires',
  'Hard Drives & Storage',
  'Power Supplies',
  'Other Electronics'
];

const conditionOptions = [
  'Whole',
  'Parts'
];

function EWasteForm({ onSubmit, isAnalyzing }: EWasteFormProps) {
  const [formData, setFormData] = useState<EWasteData>({
    images: [],
    type: '',
    quantity: 0,
    weight: 0,
    condition: '',
    parts: '',
    additionalInfo: ''
  });

  const handleImageChange = (files: File[]) => {
    setFormData({ ...formData, images: files });
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'weight' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const hasImages = formData.images.length > 0;
  const hasRequiredFields = formData.type && formData.condition && (formData.quantity > 0 || formData.weight > 0) &&
    (formData.condition !== 'Parts' || (formData.parts && formData.parts.trim() !== ''));
  const isFormValid = hasImages || hasRequiredFields;

  return (
    <div className="ewaste-form-container">
      <div className="form-header">
        <h2>E-Waste Assessment</h2>
        <p>Provide images or enter details about your e-waste for valuation analysis</p>
      </div>

      <form onSubmit={handleSubmit} className="ewaste-form">
        <ImageUpload
          images={formData.images}
          onImagesChange={handleImageChange}
        />

        {hasImages && !hasRequiredFields && (
          <div className="info-banner">
            <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>For more accurate analysis, please provide additional details below. Image analysis alone may not be 100% accurate.</p>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">
              Type of E-Waste {!hasImages && <span className="required">*</span>}
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select type...</option>
              {eWasteTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="condition">
              Condition {!hasImages && <span className="required">*</span>}
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select condition...</option>
              {conditionOptions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </div>
        </div>

        {formData.condition === 'Parts' && (
          <div className="form-group">
            <label htmlFor="parts">
              Specify Parts {!hasImages && <span className="required">*</span>}
            </label>
            <input
              type="text"
              id="parts"
              name="parts"
              value={formData.parts || ''}
              onChange={handleInputChange}
              placeholder="e.g., RAM, hard drive, motherboard, screen"
              className="form-input"
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">
              Quantity (units)
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity || ''}
              onChange={handleInputChange}
              min="0"
              placeholder="Optional"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight">
              Weight (kg)
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight || ''}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="Optional"
              className="form-input"
            />
          </div>
        </div>
        {!hasImages && <p className="form-note">* Quantity or weight required when submitting without images</p>}

        <div className="form-group">
          <label htmlFor="additionalInfo">
            Additional Information
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleInputChange}
            rows={4}
            placeholder="Any additional details about the e-waste (brand, model, visible damage, etc.)"
            className="form-textarea"
          />
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={!isFormValid || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner"></span>
              Analyzing...
            </>
          ) : (
            'Analyze E-Waste'
          )}
        </button>
      </form>
    </div>
  );
}

export default EWasteForm;
