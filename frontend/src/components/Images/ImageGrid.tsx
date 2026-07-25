import ImageCard from './ImageCard'
import type { ImageInfo } from '../../types'

interface Props {
  images: ImageInfo[]
  loading: boolean
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
  onPreview: (image: ImageInfo) => void
}

export default function ImageGrid({ images, loading, onDelete, onRename, onPreview }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <p className="text-lg">No images yet</p>
        <p className="text-sm mt-1">Upload some images to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          onDelete={onDelete}
          onRename={onRename}
          onPreview={onPreview}
        />
      ))}
    </div>
  )
}
