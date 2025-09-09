import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const DocumentUpload = ({ onUploadSuccess, apiKey }) => {
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error
  const [uploadedFile, setUploadedFile] = useState(null)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!apiKey) {
      setError('OpenAI API key is required. Please set your API key first.')
      return
    }

    setUploadedFile(file)
    setUploadStatus('uploading')
    setError('')
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('openai_api_key', apiKey)

      const response = await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        },
      })

      setUploadStatus('success')
      if (onUploadSuccess) {
        onUploadSuccess(response.data)
      }
    } catch (err) {
      setUploadStatus('error')
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    }
  }, [onUploadSuccess, apiKey])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const resetUpload = () => {
    setUploadStatus('idle')
    setUploadedFile(null)
    setError('')
    setUploadProgress(0)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-600">
          Upload PDF, DOCX, or TXT files to create searchable embeddings with Redis Cloud
        </p>
      </div>

      <div className="card max-w-2xl mx-auto">
        {uploadStatus === 'idle' && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop your file here' : 'Drag & drop a file here'}
            </p>
            <p className="text-gray-500 mb-4">or click to select a file</p>
            <div className="flex justify-center space-x-4 text-sm text-gray-400">
              <span>PDF</span>
              <span>•</span>
              <span>DOCX</span>
              <span>•</span>
              <span>TXT</span>
              <span>•</span>
              <span>Max 10MB</span>
            </div>
          </div>
        )}

        {uploadStatus === 'uploading' && uploadedFile && (
          <div className="text-center space-y-4">
            <File className="w-12 h-12 text-primary-500 mx-auto" />
            <div>
              <p className="font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              Processing document and creating embeddings... {uploadProgress}%
            </p>
          </div>
        )}

        {uploadStatus === 'success' && uploadedFile && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <p className="font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-sm text-green-600">Successfully processed and indexed!</p>
            </div>
            <button
              onClick={resetUpload}
              className="btn-primary"
            >
              Upload Another Document
            </button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <div>
              <p className="font-medium text-red-900">Upload Failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={resetUpload}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Upload your document (PDF, DOCX, or TXT)</li>
            <li>The document is split into chunks for better search accuracy</li>
            <li>Each chunk is converted to embeddings using OpenAI</li>
            <li>Embeddings are stored in Redis Cloud with vector indexing</li>
            <li>You can now perform semantic search across all documents</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default DocumentUpload
