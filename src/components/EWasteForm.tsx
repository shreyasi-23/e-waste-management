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
  'Working',
  'Partially Working',
  'Not Working',
  'For Parts',
  'Unknown'
];

function EWasteForm({ onSubmit, isAnalyzing }: EWasteFormProps) {
  const [formData, setFormData] = useState<EWasteData>({
    images: [],
    type: '',
    quantity: 1,
    weight: 0,
    condition: '',
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

  const isFormValid = formData.type && formData.quantity > 0 && formData.condition;

  return (
    <div className="ewaste-form-container">
      <div className="form-header">
        <h2>E-Waste Assessment</h2>
        <p>Enter details about the e-waste to estimate its economic value</p>
      </div>

      <form onSubmit={handleSubmit} className="ewaste-form">
        <ImageUpload
          images={formData.images}
          onImagesChange={handleImageChange}
        />

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">
              Type of E-Waste <span className="required">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
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
              Condition <span className="required">*</span>
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              required
              className="form-select"
            >
              <option value="">Select condition...</option>
              {conditionOptions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">
              Quantity (units) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              required
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
