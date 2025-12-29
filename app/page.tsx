'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface FileItem {
  key: string;
  url: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  useEffect(() => {
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

  const copyToClipboard = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy link');
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                    <div className={styles.fileUrl}>{file.url}</div>
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => handleDownload(file.url, file.key)}
                        className={styles.downloadButton}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => copyToClipboard(file.url, originalIndex)}
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
    </div>
  );
}

