'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export default function VideoUpload({ userId, onUploadComplete }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending', // pending, uploading, processing, completed, error
      error: null,
      submissionId: null,
      uploadUrl: null
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(rejection => {
        console.error('Rejected file:', rejection.file.name, rejection.errors)
      })
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
        // Step 1: Initialize upload
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'initializing', progress: 5 } : f
        ))

        const initResponse = await fetch('/api/upload/video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            filename: fileData.file.name,
            fileSize: fileData.file.size,
            contentType: fileData.file.type
          })
        })

        if (!initResponse.ok) {
          const error = await initResponse.json()
          throw new Error(error.error || 'Failed to initialize upload')
        }

        const { submissionId, uploadUrl } = await initResponse.json()

        // Step 2: Upload to Mux
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { 
            ...f, 
            status: 'uploading', 
            progress: 10,
            submissionId,
            uploadUrl
          } : f
        ))

        // Upload file with progress tracking
        await uploadWithProgress(fileData.file, uploadUrl, (progress) => {
          setFiles(prev => prev.map(f => 
            f.id === fileData.id ? { 
              ...f, 
              progress: 10 + (progress * 0.6) // 10% to 70% for upload
            } : f
          ))
        })

        // Step 3: Monitor processing
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { 
            ...f, 
            status: 'processing', 
            progress: 70
          } : f
        ))

        // Poll for completion
        await monitorProcessing(submissionId, fileData.id)

      } catch (error) {
        console.error('Upload error:', error)
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { 
            ...f, 
            status: 'error', 
            error: error.message,
            progress: 0
          } : f
        ))
      }
    }
    
    setUploading(false)
    
    // Notify parent component
    if (onUploadComplete) {
      onUploadComplete()
    }
  }

  const uploadWithProgress = (file, uploadUrl, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: Network error'))
      })

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })
  }

  const monitorProcessing = async (submissionId, fileId) => {
    const maxAttempts = 120 // 10 minutes with 5-second intervals
    let attempts = 0
    let consecutiveUploading = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/upload/video?submissionId=${submissionId}`)
        
        if (!response.ok) {
          throw new Error('Failed to check status')
        }

        const status = await response.json()
        
        // Track consecutive "uploading" status to detect stuck uploads
        if (status.status === 'uploading') {
          consecutiveUploading++
          // If stuck in uploading for more than 2 minutes, mark as failed
          if (consecutiveUploading > 24) { // 24 * 5 seconds = 2 minutes
            throw new Error('Upload appears to be stuck. Please try again.')
          }
        } else {
          consecutiveUploading = 0
        }
        
        // Update progress based on status
        let progress = 70
        let fileStatus = 'processing'

        switch (status.status) {
          case 'uploading':
            progress = 75
            break
          case 'processing':
            progress = 80
            break
          case 'ready':
            progress = 85
            break
          case 'anonymizing':
            progress = 90
            break
          case 'completed':
            progress = 100
            fileStatus = 'completed'
            break
          case 'failed':
            fileStatus = 'error'
            progress = 0
            break
        }

        setFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: fileStatus,
            progress,
            error: status.status === 'failed' ? status.processingNotes : null
          } : f
        ))

        if (status.status === 'completed' || status.status === 'failed') {
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000) // Poll every 5 seconds
        } else {
          throw new Error('Processing timeout after 10 minutes. Please contact support if this continues.')
        }

      } catch (error) {
        console.error('Status check error:', error)
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'error',
            error: error.message,
            progress: 0
          } : f
        ))
      }
    }

    poll()
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
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'uploading':
      case 'initializing':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'processing':
      case 'anonymizing':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Upload className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ready to upload'
      case 'initializing': return 'Initializing...'
      case 'uploading': return 'Uploading...'
      case 'processing': return 'Processing...'
      case 'anonymizing': return 'Anonymizing faces and plates...'
      case 'completed': return 'Completed'
      case 'error': return 'Failed'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Upload Your Dashcam Videos</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Supported formats: MP4, MOV, AVI, MKV</li>
          <li>• Maximum file size: 500MB per video</li>
          <li>• We automatically anonymize faces and license plates</li>
          <li>• You earn $0.50-$2.00 per minute of processed footage</li>
          <li>• Processing typically takes 5-10 minutes</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-900 mb-2">Expected Earnings</h4>
        <div className="text-sm text-green-700 space-y-1">
          <p>• Bronze drivers: $3-6/hour base rate</p>
          <p>• Silver drivers: $4.80-8/hour (10+ videos)</p>
          <p>• Gold drivers: $6-10/hour (50+ videos)</p>
          <p>• Platinum drivers: $7.20-12/hour (100+ videos)</p>
          <p className="font-semibold mt-2">+ Edge case bounties: $5-50 per rare event!</p>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop the videos here...</p>
        ) : (
          <div>
            <p className="text-gray-600 font-medium mb-2">Drag and drop videos here, or click to select</p>
            <p className="text-sm text-gray-500">Multiple files supported</p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-gray-900">Files to Upload ({files.length})</h4>
            <button
              onClick={uploadFiles}
              disabled={uploading || files.every(f => f.status !== 'pending')}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Processing...' : 'Upload All'}
            </button>
          </div>
          
          <div className="space-y-3">
            {files.map((fileData) => (
              <div key={fileData.id} className="flex items-center space-x-4 p-4 bg-white border rounded-lg shadow-sm">
                <div className="flex-shrink-0">
                  {getStatusIcon(fileData.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileData.file.name}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatFileSize(fileData.file.size)}</span>
                    <span>•</span>
                    <span className={
                      fileData.status === 'error' ? 'text-red-600' :
                      fileData.status === 'completed' ? 'text-green-600' :
                      'text-gray-600'
                    }>
                      {getStatusText(fileData.status)}
                    </span>
                  </div>
                  {fileData.error && (
                    <p className="text-sm text-red-600 mt-1">{fileData.error}</p>
                  )}
                </div>
                
                {/* Progress Bar */}
                {(fileData.status === 'uploading' || fileData.status === 'processing' || fileData.status === 'anonymizing' || fileData.status === 'initializing') && (
                  <div className="flex-shrink-0 w-32">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileData.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {Math.round(fileData.progress)}%
                    </p>
                  </div>
                )}
                
                {/* Remove Button */}
                {(fileData.status === 'pending' || fileData.status === 'error') && (
                  <button
                    onClick={() => removeFile(fileData.id)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}