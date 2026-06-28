import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-2xl font-serif font-bold">
              Koch<span className="text-primary">Welt</span>
            </span>
            <p className="text-gray-400 text-sm mt-1">
              Entdecke die Welt des Kochens.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Impressum
            </Link>
            <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Datenschutz
            </Link>
            <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Kontakt
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} KochWelt. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  )
}
