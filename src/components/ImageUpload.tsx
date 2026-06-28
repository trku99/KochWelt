'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onUpload: (url: string) => void
  currentImage?: string
}

export default function ImageUpload({ onUpload, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentPreview = preview || currentImage || null

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Nur Bilddateien sind erlaubt.')
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setError('Du musst angemeldet sein, um Bilder hochzuladen.')
      setUploading(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = fileName

    try {
      const publicUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open(
          'POST',
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/recipe-images/${filePath}`
        )
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.setRequestHeader('Content-Type', file.type)

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const { data } = supabase.storage.from('recipe-images').getPublicUrl(filePath)
            resolve(data.publicUrl)
          } else {
            reject(new Error('Upload fehlgeschlagen'))
          }
        }

        xhr.onerror = () => reject(new Error('Upload fehlgeschlagen'))
        xhr.send(file)
      })

      onUpload(publicUrl)
      setProgress(100)
    } catch {
      setError('Upload fehlgeschlagen. Bitte versuche es erneut.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  const handleFile = (file: File) => {
    uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden',
          isDragging
            ? 'border-primary bg-primary-50'
            : currentPreview
              ? 'border-transparent'
              : 'border-gray-300 hover:border-primary hover:bg-gray-50',
          currentPreview ? 'aspect-[3/2]' : 'aspect-[3/2]'
        )}
      >
        {currentPreview ? (
          <>
            <Image
              src={currentPreview}
              alt="Vorschau"
              fill
              className="object-cover"
            />
            {!uploading && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity">
                  Bild ändern
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm text-gray-500">
              Bild hier ablegen oder klicken zum Auswählen
            </p>
            <p className="text-xs text-gray-400">
              Nur Bilddateien (JPEG, PNG, WebP)
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Upload läuft...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
