import * as XLSX from "xlsx";

export const exportToCSV = (data: any[], fileName: string) => {
  const headers = [
    "Date",
    "TXID",
    "Particulars",
    "Party",
    "Debit",
    "Credit",
    "Balance",
  ];
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      [
        row.date,
        row.txid,
        `"${row.particulars.replace(/"/g, '""')}"`,
        `"${row.party.replace(/"/g, '""')}"`,
        row.debit,
        row.credit,
        row.balance,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${fileName}.csv`);
  link.click();
};

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger Statement");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToJSON = (data: any[], fileName: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${fileName}.json`);
  link.click();
};

export const exportToXML = (data: any[], fileName: string) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<LedgerStatement>\n';
  data.forEach((item) => {
    xml += "  <Entry>\n";
    Object.keys(item).forEach((key) => {
      xml += `    <${key}>${item[key]}</${key}>\n`;
    });
    xml += "  </Entry>\n";
  });
  xml += "</LedgerStatement>";

  const blob = new Blob([xml], { type: "application/xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${fileName}.xml`);
  link.click();
};
