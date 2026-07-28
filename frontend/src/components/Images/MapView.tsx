import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin } from 'lucide-react'
import { getImageUrl } from '../../api/images'
import type { GeotaggedImage } from '../../api/images'

interface Props {
  images: GeotaggedImage[]
  loading: boolean
}

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapView({ images, loading }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [41.9, 12.5],
      zoom: 5,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) layer.remove()
    })

    if (images.length === 0) return

    const bounds = L.latLngBounds([])

    for (const img of images) {
      const marker = L.marker([img.gps_lat, img.gps_lng])
      const imgUrl = getImageUrl(img.id)
      marker.bindPopup(`
        <div style="text-align:center;min-width:120px">
          <img src="${imgUrl}" alt="${img.original}"
               style="width:120px;height:90px;object-fit:cover;border-radius:4px;margin-bottom:4px"
               onerror="this.style.display='none'" />
          <div style="font-size:11px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${img.original}</div>
        </div>
      `)
      marker.bindTooltip(img.original, { direction: 'top' })
      marker.addTo(map)
      bounds.extend([img.gps_lat, img.gps_lng])
    }

    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
  }, [images])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <MapPin size={32} className="mb-2 opacity-30" />
        <p className="text-xs">Nessuna foto con posizione GPS</p>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-dark-600/30" />
}
