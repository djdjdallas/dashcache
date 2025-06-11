'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

export default function VideoUpload({ userId, onUploadComplete }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending', // pending, uploading, completed, error
      error: null
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    
    if (rejectedFiles.length > 0) {
      console.error('Rejected files:', rejectedFiles)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: true
  })

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFiles = async () => {
    if (files.length === 0 || uploading) return
    
    setUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      const fileData = files[i]
      if (fileData.status !== 'pending') continue
      
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'uploading' } : f
        ))
        
        // Create form data
        const formData = new FormData()
        formData.append('video', fileData.file)
        formData.append('userId', userId)
        formData.append('filename', fileData.file.name)
        
        // Upload to API
        const response = await fetch('/api/upload/video', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('Upload failed')
        }
        
        const result = await response.json()
        
        // Update status to completed
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'completed', progress: 100 } : f
        ))
        
      } catch (error) {
        console.error('Upload error:', error)
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'error', error: error.message } : f
        ))
      }
    }
    
    setUploading(false)
    
    // Notify parent component
    if (onUploadComplete) {
      onUploadComplete()
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className=\"h-5 w-5 text-green-500\" />
      case 'error':
        return <AlertCircle className=\"h-5 w-5 text-red-500\" />
      case 'uploading':
        return <div className=\"h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin\" />
      default:
        return <Upload className=\"h-5 w-5 text-gray-400\" />
    }
  }

  return (
    <div className=\"space-y-6\">
      {/* Upload Instructions */}
      <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4\">
        <h3 className=\"text-lg font-medium text-blue-900 mb-2\">Upload Your Dashcam Videos</h3>\n        <ul className=\"text-sm text-blue-700 space-y-1\">\n          <li>\u2022 Supported formats: MP4, MOV, AVI, MKV</li>\n          <li>\u2022 Maximum file size: 500MB per video</li>\n          <li>\u2022 We automatically anonymize faces and license plates</li>\n          <li>\u2022 You earn $0.50-$2.00 per minute of processed footage</li>\n        </ul>\n      </div>\n\n      {/* Dropzone */}\n      <div\n        {...getRootProps()}\n        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${\n          isDragActive \n            ? 'border-blue-500 bg-blue-50' \n            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'\n        }`}\n      >\n        <input {...getInputProps()} />\n        <Upload className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />\n        {isDragActive ? (\n          <p className=\"text-blue-600 font-medium\">Drop the videos here...</p>\n        ) : (\n          <div>\n            <p className=\"text-gray-600 font-medium mb-2\">Drag and drop videos here, or click to select</p>\n            <p className=\"text-sm text-gray-500\">Multiple files supported</p>\n          </div>\n        )}\n      </div>\n\n      {/* File List */}\n      {files.length > 0 && (\n        <div className=\"space-y-4\">\n          <div className=\"flex justify-between items-center\">\n            <h4 className=\"text-lg font-medium text-gray-900\">Files to Upload</h4>\n            <button\n              onClick={uploadFiles}\n              disabled={uploading || files.every(f => f.status !== 'pending')}\n              className=\"px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed\"\n            >\n              {uploading ? 'Uploading...' : 'Upload All'}\n            </button>\n          </div>\n          \n          <div className=\"space-y-2\">\n            {files.map((fileData) => (\n              <div key={fileData.id} className=\"flex items-center space-x-4 p-4 bg-white border rounded-lg\">\n                <div className=\"flex-shrink-0\">\n                  {getStatusIcon(fileData.status)}\n                </div>\n                \n                <div className=\"flex-1 min-w-0\">\n                  <p className=\"text-sm font-medium text-gray-900 truncate\">\n                    {fileData.file.name}\n                  </p>\n                  <p className=\"text-sm text-gray-500\">\n                    {formatFileSize(fileData.file.size)}\n                  </p>\n                  {fileData.error && (\n                    <p className=\"text-sm text-red-600\">{fileData.error}</p>\n                  )}\n                </div>\n                \n                {fileData.status === 'uploading' && (\n                  <div className=\"flex-shrink-0 w-32\">\n                    <div className=\"bg-gray-200 rounded-full h-2\">\n                      <div \n                        className=\"bg-blue-600 h-2 rounded-full transition-all duration-300\"\n                        style={{ width: `${fileData.progress}%` }}\n                      />\n                    </div>\n                  </div>\n                )}\n                \n                {(fileData.status === 'pending' || fileData.status === 'error') && (\n                  <button\n                    onClick={() => removeFile(fileData.id)}\n                    className=\"flex-shrink-0 p-1 text-gray-400 hover:text-gray-600\"\n                  >\n                    <X className=\"h-4 w-4\" />\n                  </button>\n                )}\n              </div>\n            ))}\n          </div>\n        </div>\n      )}\n    </div>\n  )\n}