'use client';

import { useState, useRef } from 'react';
import styles from './Sidebar.module.css';

export default function ImageUploadModal({ isOpen, onClose, onImageSelect, placeholderDimensions }) {
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'url'
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          onImageSelect({
            src: e.target.result,
            width: img.width,
            height: img.height,
            type: 'file'
          });
          resetModal();
        };
        img.onerror = () => {
          setError('Failed to load image. Please check the file.');
          setLoading(false);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error reading file: ' + err.message);
      setLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Convert to canvas to handle CORS issues
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        onImageSelect({
          src: canvas.toDataURL('image/png'),
          width: img.width,
          height: img.height,
          originalUrl: urlInput,
          type: 'url'
        });
        resetModal();
      };
      img.onerror = () => {
        setError('Failed to load image from URL. Check the URL and CORS settings.');
        setLoading(false);
      };
      img.src = urlInput;
    } catch (err) {
      setError('Error loading URL: ' + err.message);
      setLoading(false);
    }
  };

  const resetModal = () => {
    setUrlInput('');
    setUploadMethod('file');
    setError('');
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
          Upload Header Image
        </h2>

        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setUploadMethod('file')}
            style={{
              padding: '10px 16px',
              backgroundColor: uploadMethod === 'file' ? '#f3f4f6' : 'transparent',
              border: 'none',
              borderBottom: uploadMethod === 'file' ? '2px solid #4700a3' : 'none',
              cursor: 'pointer',
              fontWeight: uploadMethod === 'file' ? '600' : '400',
              color: uploadMethod === 'file' ? '#4700a3' : '#6b7280'
            }}
          >
            Upload File
          </button>
          <button
            onClick={() => setUploadMethod('url')}
            style={{
              padding: '10px 16px',
              backgroundColor: uploadMethod === 'url' ? '#f3f4f6' : 'transparent',
              border: 'none',
              borderBottom: uploadMethod === 'url' ? '2px solid #4700a3' : 'none',
              cursor: 'pointer',
              fontWeight: uploadMethod === 'url' ? '600' : '400',
              color: uploadMethod === 'url' ? '#4700a3' : '#6b7280'
            }}
          >
            Link Image
          </button>
        </div>

        {/* File upload method */}
        {uploadMethod === 'file' && (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#f9fafb',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Click to browse or drag and drop
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Supported formats: JPG, PNG, GIF, WebP (max 10MB)
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* URL input method */}
        {uploadMethod === 'url' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Image URL
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Placeholder dimensions info */}
        {placeholderDimensions && (
          <div style={{
            padding: '12px',
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px'
          }}>
            Header dimensions: {placeholderDimensions.width}px × {placeholderDimensions.height}px
            <br />
            <span style={{ fontSize: '12px', color: '#1e3a8a' }}>
              Image will be resized to fit this space
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => resetModal()}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          {uploadMethod === 'url' && (
            <button
              onClick={handleUrlSubmit}
              disabled={loading || !urlInput.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4700a3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading || !urlInput.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: loading || !urlInput.trim() ? 0.6 : 1
              }}
            >
              {loading ? 'Loading...' : 'Insert Image'}
            </button>
          )}
        </div>

        {loading && (
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Loading image...
          </div>
        )}
      </div>
    </div>
  );
}
