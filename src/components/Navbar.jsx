import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="mx-auto flex h-16 max-w-6xl items-center px-6">
      <Link to="/" className="placard flex items-center gap-2 text-2xl text-sunprint">
        <span className="size-3 rounded-full bg-lamp" aria-hidden="true" />
        Smile
      </Link>
    </header>
  )
}
