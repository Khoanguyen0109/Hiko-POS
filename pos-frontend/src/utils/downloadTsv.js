const escapeTsvCell = (value) => {
  const str = value == null ? "" : String(value);
  if (/[\t\n\r"]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const downloadTsv = (filename, headers, rows) => {
  const lines = [
    headers.map(escapeTsvCell).join("\t"),
    ...rows.map((row) => row.map(escapeTsvCell).join("\t")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n") + "\n"], {
    type: "text/tab-separated-values;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};
