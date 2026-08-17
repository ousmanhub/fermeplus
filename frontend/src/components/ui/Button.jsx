export function Button({ children, variant = 'default', size = 'default', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none disabled:opacity-50'
  const variants = {
    default: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  }
  const sizes = {
    default: 'px-4 py-2',
    sm: 'px-3 py-1.5 text-sm',
    lg: 'px-6 py-3',
    icon: 'p-2',
  }
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
