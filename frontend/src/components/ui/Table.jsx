export function Table({ children, className = '' }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <table className={`w-full text-sm ${className}`}>{children}</table>
    </div>
  )
}

export function TableHeader({ children }) {
  return <thead className="bg-gray-50">{children}</thead>
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>
}

export function TableRow({ children }) {
  return <tr className="border-b last:border-0">{children}</tr>
}

export function TableHead({ children, className = '' }) {
  return <th className={`h-10 px-4 text-left font-medium text-gray-500 ${className}`}>{children}</th>
}

export function TableCell({ children, className = '' }) {
  return <td className={`p-4 ${className}`}>{children}</td>
}
