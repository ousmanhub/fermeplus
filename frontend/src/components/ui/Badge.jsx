export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-green-100 text-green-800',
    secondary: 'bg-gray-100 text-gray-700',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border text-gray-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
