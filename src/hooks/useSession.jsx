import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)
export const useSession = () => useContext(Ctx)

// Menyimpan state antar halaman. Semua foto hanya hidup di memori browser.
export function SessionProvider({ children }) {
  const [count, setCount] = useState(4)
  const [photos, setPhotos] = useState([])
  const [final, setFinal] = useState(null)
  return <Ctx.Provider value={{ count, setCount, photos, setPhotos, final, setFinal }}>{children}</Ctx.Provider>
}
