export default function DataTable({ columns, rows, keyField = 'id', empty = 'No records found', loading }) {
  if (loading) {
    return <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">Loading…</div>
  }
  if (!rows?.length) {
    return <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">{empty}</div>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50">
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map(row => (
            <tr key={row[keyField]} className="hover:bg-neutral-50">
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-3 align-middle ${col.cellClassName || ''}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
