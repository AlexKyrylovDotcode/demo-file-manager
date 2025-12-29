'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface FileItem {
  key: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [extractingIndex, setExtractingIndex] = useState<number | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    console.log('test');
    loadFiles();

  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter(file =>
        file.key.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [searchQuery, files]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/files');
      const data = await response.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileName: string, index: number) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setDeletingIndex(index);
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await loadFiles();
        alert('File deleted successfully!');
      } else {
        alert('Delete failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    } finally {
      setDeletingIndex(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.fileName) {
        await loadFiles();
        alert('File uploaded successfully!');
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const copyToClipboard = async (fileName: string, index: number) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(fileName)}/url`);
      const data = await response.json();
      
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        alert('Failed to generate link: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy link');
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(fileName)}/url`);
      const data = await response.json();
      
      if (data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Failed to get download URL');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleExtractText = async (fileName: string, index: number) => {
    setExtractingIndex(index);
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(fileName)}/extract`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.text !== undefined) {
        setExtractedText(data.text);
        setShowModal(true);
      } else {
        alert('Extraction failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Extract error:', error);
      alert('Failed to extract text');
    } finally {
      setExtractingIndex(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>S3 File Manager</h1>
        
        <div className={styles.uploadSection}>
          <label htmlFor="file-upload" className={styles.uploadButton}>
            {uploading ? 'Uploading...' : 'Choose File to Upload'}
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className={styles.fileInput}
          />
        </div>

        <div className={styles.filesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Uploaded Files</h2>
            {files.length > 0 && (
              <input
                type="text"
                placeholder="Search by file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            )}
          </div>
          {loading ? (
            <div className={styles.loading}>Loading files...</div>
          ) : files.length === 0 ? (
            <div className={styles.empty}>No files uploaded yet</div>
          ) : filteredFiles.length === 0 ? (
            <div className={styles.empty}>No files found matching "{searchQuery}"</div>
          ) : (
            <div className={styles.fileList}>
              {filteredFiles.map((file, index) => {
                const originalIndex = files.findIndex(f => f.key === file.key);
                return (
                  <div key={file.key} className={styles.fileItem}>
                    <div className={styles.fileName}>{file.key}</div>
                    <div className={styles.buttonGroup}>
                      {file.key.toLowerCase().endsWith('.pdf') && (
                        <button
                          onClick={() => handleExtractText(file.key, originalIndex)}
                          disabled={extractingIndex === originalIndex}
                          className={styles.extractButton}
                        >
                          {extractingIndex === originalIndex ? 'Extracting...' : 'Extract Text'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(file.key)}
                        className={styles.downloadButton}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => copyToClipboard(file.key, originalIndex)}
                        className={styles.copyButton}
                      >
                        {copiedIndex === originalIndex ? '✓ Copied!' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.key, originalIndex)}
                        disabled={deletingIndex === originalIndex}
                        className={styles.deleteButton}
                      >
                        {deletingIndex === originalIndex ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Extracted Text</h2>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {extractedText ? (
                <pre className={styles.extractedText}>{extractedText}</pre>
              ) : (
                <div className={styles.empty}>No text extracted</div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.copyTextButton}
                onClick={() => {
                  if (extractedText) {
                    navigator.clipboard.writeText(extractedText);
                    alert('Text copied to clipboard!');
                  }
                }}
              >
                Copy Text
              </button>
              <button
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

