export function Table({ children, ...props }) {
  return (
    <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900" style={{ borderCollapse: 'separate', borderSpacing: 0 }} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ children, ...props }) {
  return (
    <thead className="bg-gray-50 dark:bg-gradient-to-r dark:from-blue-900 dark:to-blue-800 dark:text-blue-100" {...props}>
      {children}
    </thead>
  );
}

export function TableRow({ children, ...props }) {
  return (
    <tr className="hover:bg-gray-100 dark:hover:bg-blue-900 transition-colors" style={{ minHeight: '56px' }} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, ...props }) {
  return (
    <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 dark:text-blue-100 uppercase tracking-wider bg-gray-50 dark:bg-blue-900" {...props}>
      {children}
    </th>
  );
}

export function TableBody({ children, ...props }) {
  return (
    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" {...props}>
      {children}
    </tbody>
  );
}

export function TableCell({ children, ...props }) {
  return (
    <td className="px-8 py-4 whitespace-nowrap text-base text-gray-900 dark:text-blue-100 dark:bg-gray-900" {...props}>
      {children}
    </td>
  );
}
