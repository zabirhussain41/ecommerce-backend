import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-neutral-200">404</p>
      <h1 className="mt-2 text-xl font-bold text-neutral-900">Page not found</h1>
      <p className="mt-1 text-sm text-neutral-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6"><Button>Back to home</Button></Link>
    </div>
  )
}
