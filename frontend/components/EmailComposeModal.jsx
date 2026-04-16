'use client';
import { useState, useRef } from 'react';
import styles from './EmailComposeModal.module.css';
import {
  generateEMLContent,
  downloadEML,
  getGmailLink,
  getOutlookWebLink,
  getYahooMailLink,
  generateHTMLTemplate,
  downloadHTML,
  getWebClientInstructions,
} from '../lib/email-utils';

export default function EmailComposeModal({
  isOpen,
  onClose,
  canvas,
  template,
}) {
  const [selectedClient, setSelectedClient] = useState('outlook-desktop');
  const [subject, setSubject] = useState(template?.name || 'Email Banner');
  const [body, setBody] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Get canvas image as base64
  const getCanvasImage = () => {
    if (!canvas) return null;
    return canvas.toDataURL({ format: 'png', quality: 1 });
  };

  const handleSendDesktopClient = () => {
    if (!canvas) {
      setMessage({ type: 'error', text: 'Canvas not ready' });
      return;
    }

    setIsLoading(true);
    try {
      const imageBase64 = getCanvasImage();
      const eml = generateEMLContent(
        recipientEmail || 'your-email@example.com',
        subject,
        body,
        imageBase64,
        `${template?.name || 'banner'}.png`
      );

      downloadEML(eml, subject.replace(/[^a-z0-9]/gi, '-').toLowerCase());
      setMessage({
        type: 'success',
        text: '✓ .EML file downloaded! Open it in Outlook, Apple Mail, or Thunderbird to compose your email.',
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
    setIsLoading(false);
  };

  const handleSendWebClient = () => {
    if (!canvas) {
      setMessage({ type: 'error', text: 'Canvas not ready' });
      return;
    }

    try {
      const linkBody = `${body}\n\n--- Instructions: Download the banner image and insert at the top of your email ---`;

      let url;
      switch (selectedClient) {
        case 'gmail':
          url = getGmailLink(subject, linkBody);
          break;
        case 'outlook-web':
          url = getOutlookWebLink(subject, linkBody);
          break;
        case 'yahoo':
          url = getYahooMailLink(subject, linkBody);
          break;
        default:
          return;
      }

      window.open(url, '_blank');
      setMessage({
        type: 'info',
        text: `✓ Compose window opened! Download the banner image and insert it at the top of your email.`,
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };

  const handleDownloadHTML = () => {
    if (!canvas) {
      setMessage({ type: 'error', text: 'Canvas not ready' });
      return;
    }

    try {
      const imageBase64 = getCanvasImage();
      const html = generateHTMLTemplate(subject, body, imageBase64);
      downloadHTML(html, subject.replace(/[^a-z0-9]/gi, '-').toLowerCase());
      setMessage({
        type: 'success',
        text: '✓ HTML template downloaded! You can open it in any browser or copy-paste into your email client.',
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };

  const clientOptions = [
    {
      id: 'outlook-desktop',
      label: 'Outlook Desktop / Apple Mail / Thunderbird',
      description: 'Download .EML file with image embedded',
    },
    {
      id: 'gmail',
      label: 'Gmail (Web)',
      description: 'Opens Gmail compose in new tab',
    },
    {
      id: 'outlook-web',
      label: 'Outlook Web',
      description: 'Opens Outlook Web compose in new tab',
    },
    {
      id: 'yahoo',
      label: 'Yahoo Mail (Web)',
      description: 'Opens Yahoo Mail compose in new tab',
    },
    {
      id: 'advanced',
      label: 'Advanced (HTML Template)',
      description: 'Download HTML file for any email client',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Send Email with Banner</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {/* Email Client Selection */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>Select your email client:</label>
            <div className={styles.clientOptions}>
              {clientOptions.map((option) => (
                <div key={option.id} className={styles.clientOption}>
                  <input
                    type="radio"
                    id={option.id}
                    name="emailClient"
                    value={option.id}
                    checked={selectedClient === option.id}
                    onChange={(e) => {
                      setSelectedClient(e.target.value);
                      setMessage(null);
                    }}
                  />
                  <label htmlFor={option.id} className={styles.clientLabel}>
                    <div className={styles.clientName}>{option.label}</div>
                    <div className={styles.clientDesc}>{option.description}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Email Details Form */}
          <div className={styles.section}>
            <label className={styles.inputLabel}>
              Email Subject *
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className={styles.input}
                maxLength={80}
              />
            </label>

            {selectedClient !== 'advanced' && selectedClient !== 'gmail' && selectedClient !== 'outlook-web' && selectedClient !== 'yahoo' && (
              <label className={styles.inputLabel}>
                Recipient Email (optional)
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className={styles.input}
                />
              </label>
            )}

            <label className={styles.inputLabel}>
              Email Body (optional)
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add your message here. The banner will appear at the top."
                className={styles.textarea}
                maxLength={1000}
              />
            </label>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`${styles.message} ${styles[`message-${message.type}`]}`}>
              {message.text}
            </div>
          )}

          {/* Info for Web Clients */}
          {(selectedClient === 'gmail' ||
            selectedClient === 'outlook-web' ||
            selectedClient === 'yahoo') && (
            <div className={styles.infoBox}>
              <strong>Note:</strong> {getWebClientInstructions()}
            </div>
          )}
        </div>

        {/* Footer with Action Buttons */}
        <div className={styles.footer}>
          <button
            onClick={onClose}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isLoading}
          >
            Cancel
          </button>

          {selectedClient === 'outlook-desktop' && (
            <button
              onClick={handleSendDesktopClient}
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={isLoading || !subject}
            >
              {isLoading ? 'Generating...' : 'Download .EML File'}
            </button>
          )}

          {(selectedClient === 'gmail' ||
            selectedClient === 'outlook-web' ||
            selectedClient === 'yahoo') && (
            <button
              onClick={handleSendWebClient}
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={isLoading || !subject}
            >
              {isLoading ? 'Opening...' : 'Open Compose Window'}
            </button>
          )}

          {selectedClient === 'advanced' && (
            <button
              onClick={handleDownloadHTML}
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={isLoading || !subject}
            >
              {isLoading ? 'Generating...' : 'Download HTML Template'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
