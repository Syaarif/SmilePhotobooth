import { useCallback, useEffect, useRef, useState } from 'react'

export default function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [mirror, setMirror] = useState(true)
  const [status, setStatus] = useState('loading') // loading | ready | denied | error

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async (id) => {
    stop()
    setStatus('loading')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...(id ? { deviceId: { exact: id } } : { facingMode: 'user' }),
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      const s = stream.getVideoTracks()[0].getSettings()
      setMirror(s.facingMode !== 'environment')
      setDeviceId(s.deviceId || '')
      const list = await navigator.mediaDevices.enumerateDevices()
      setDevices(list.filter((d) => d.kind === 'videoinput'))
      setStatus('ready')
    } catch (e) {
      setStatus(e.name === 'NotAllowedError' ? 'denied' : 'error')
    }
  }, [stop])

  useEffect(() => stop, [stop])

  return { videoRef, devices, deviceId, mirror, status, start }
}
