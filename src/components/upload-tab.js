import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, File, CheckCircle, AlertCircle, X } from "lucide-react"

export function UploadTab({ userId, onUploadComplete }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 11),
      progress: 0,
      status: 'pending',
      error: null
    }))
    setFiles(prev => [...prev, ...newFiles])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return
    
    setUploading(true)
    
    for (const fileItem of files) {
      if (fileItem.status !== 'pending') continue
      
      try {
        // Update status to uploading to Supabase
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'uploading', progress: 10 } : f
        ))

        // 1. Upload to Supabase Storage first (raw video)
        const fileExt = fileItem.file.name.split('.').pop()
        const fileName = `raw/${userId}/${Date.now()}.${fileExt}`
        
        // Use FormData for file upload to bypass RLS issues
        const formData = new FormData()
        formData.append('file', fileItem.file)
        formData.append('userId', userId)
        formData.append('fileName', fileName)
        
        const supabaseResponse = await fetch('/api/upload/supabase', {
          method: 'POST',
          body: formData
        })
        
        if (!supabaseResponse.ok) {
          const errorData = await supabaseResponse.json()
          throw new Error(`Supabase upload failed: ${errorData.error}`)
        }
        
        const uploadData = await supabaseResponse.json()

        // Update progress - Supabase upload complete
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, progress: 50 } : f
        ))

        // 2. Call API to create submission record and get Mux upload URL
        const response = await fetch('/api/upload/video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            filename: fileItem.file.name,
            fileSize: fileItem.file.size,
            contentType: fileItem.file.type,
            supabasePath: uploadData.path
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to get upload URL')
        }

        const { uploadUrl, submissionId } = await response.json()

        // Update progress - API call complete
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, progress: 70 } : f
        ))

        // 3. Upload file to Mux for processing
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: fileItem.file,
          headers: {
            'Content-Type': fileItem.file.type,
          }
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to Mux')
        }

        // Update status to completed
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { 
            ...f, 
            status: 'completed', 
            progress: 100,
            submissionId,
            supabasePath: uploadData.path
          } : f
        ))

      } catch (error) {
        console.error('Upload error:', error)
        console.error('Error details:', {
          userId,
          filename: fileItem.file.name,
          fileSize: fileItem.file.size,
          contentType: fileItem.file.type,
          errorMessage: error.message,
          errorStack: error.stack
        })
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { 
            ...f, 
            status: 'error', 
            error: error.message 
          } : f
        ))
      }
    }
    
    setUploading(false)
    onUploadComplete?.()
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-lg font-medium">Drop your videos here</p>
              <p className="text-gray-500 mt-1">or</p>
              <Button 
                className="mt-2"
                onClick={() => document.getElementById('file-input').click()}
              >
                Choose Files
              </Button>
              <input
                id="file-input"
                type="file"
                multiple
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Supports MP4, MOV, AVI, MKV up to 2GB each
            </p>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upload Queue ({files.length})</CardTitle>
            <div className="space-x-2">
              <Button
                onClick={clearCompleted}
                variant="outline"
                size="sm"
                disabled={!files.some(f => f.status === 'completed')}
              >
                Clear Completed
              </Button>
              <Button
                onClick={uploadFiles}
                disabled={uploading || files.every(f => f.status !== 'pending')}
              >
                Upload All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((fileItem) => (
                <div key={fileItem.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <File className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(fileItem.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    {fileItem.status === 'uploading' && (
                      <Progress value={fileItem.progress} className="mt-1 h-1" />
                    )}
                    {fileItem.error && (
                      <p className="text-xs text-red-500 mt-1">{fileItem.error}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {fileItem.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {fileItem.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {fileItem.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(fileItem.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}