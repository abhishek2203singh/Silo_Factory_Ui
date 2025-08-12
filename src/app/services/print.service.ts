import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor() { }

  print(headers: string[], rows: any[], getRowData: (row: any, index: number) => string[]) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const style = 'body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2}';

    let content = `<html><head><style>${style}</style></head><body>`;
    
    content += `<table><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    rows.forEach((row, index) => {
      content += '<tr>';
      content += getRowData(row, index).map(cell => `<td>${cell}</td>`).join('');
      content += '</tr>';
    });

    content += '</table></body></html>';

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  }
}