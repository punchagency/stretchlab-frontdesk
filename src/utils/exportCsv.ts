export function exportToCsv(filename: string, rows: Record<string, any>[], headers?: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) return;

  const resolvedHeaders = headers || Object.keys(rows[0]).map((k) => ({ key: k, label: k }));

  const csvContent = [
    resolvedHeaders.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) =>
      resolvedHeaders
        .map((h) => {
          const val = row[h.key];
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
