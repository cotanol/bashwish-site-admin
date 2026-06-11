'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// Importamos el hook de tema de MUI para detectar Dark Mode
import { useTheme } from '@mui/material/styles'

// --- Fix iconos (Igual que antes) ---
const iconParams = {
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
}
const DefaultIcon = L.icon({
  ...iconParams,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, map.getZoom())
  }, [center, map])
  return null
}

interface LeafletMapProps {
  lat?: number
  lng?: number
  onPositionChange: (lat: number, lng: number) => void
}

const LeafletMap = ({ lat, lng, onPositionChange }: LeafletMapProps) => {
  // 1. Detectamos el tema de MUI
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'

  // 2. Coordenadas por defecto: Houston, TX
  const defaultPosition: [number, number] = [29.7604, -95.3698]
  const position: [number, number] = lat && lng ? [lat, lng] : defaultPosition

  const markerRef = useRef<L.Marker>(null)

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const { lat, lng } = marker.getLatLng()
          onPositionChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)))
        }
      }
    }),
    [onPositionChange]
  )

  // 3. URLs de los mapas (Usamos CartoDB porque son más bonitos y tienen modo oscuro gratis)
  const tileLayerUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={false} // Desactivado para que no moleste al hacer scroll en la página
      style={{
        height: '100%',
        width: '100%',
        borderRadius: '8px',
        zIndex: 1,
        // Un borde sutil para que se vea bien enmarcado
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileLayerUrl}
      />
      <MapUpdater center={position} />
      <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef} />
    </MapContainer>
  )
}

export default LeafletMap
