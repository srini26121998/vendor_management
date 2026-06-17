import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

/**
 * Export data to Excel
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file
 * @param {Array} columns - Column configurations {header, accessor}
 */
export const exportToExcel = (data, fileName, columns) => {
    try {
        const worksheetData = data.map(item => {
            const row = {};
            columns.forEach(col => {
                if (col.id === 'actions') return;
                let value = item;
                const path = col.accessor.split('.');
                path.forEach(key => {
                    value = value ? value[key] : '';
                });
                row[col.header] = value;
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        toast.success('Excel exported successfully');
    } catch (error) {
        console.error('Excel Export Error:', error);
        toast.error('Failed to export Excel');
    }
};

/**
 * Export data to PDF
 * @param {Array} data - Array of objects to export
 * @param {string} title - Title of the PDF
 * @param {Array} columns - Column configurations {header, accessor}
 */
export const exportToPDF = (data, title, columns) => {
    try {
        const doc = new jsPDF();
        
        // Add Title
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        
        const tableColumn = columns
            .filter(col => col.id !== 'actions')
            .map(col => col.header);
            
        const tableRows = data.map(item => {
            return columns
                .filter(col => col.id !== 'actions')
                .map(col => {
                    let value = item;
                    const path = col.accessor.split('.');
                    path.forEach(key => {
                        value = value ? value[key] : '';
                    });
                    return value;
                });
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
        });

        doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
        toast.success('PDF exported successfully');
    } catch (error) {
        console.error('PDF Export Error:', error);
        toast.error('Failed to export PDF');
    }
};

/**
 * Print data
 * @param {Array} data - Array of objects to print
 * @param {string} title - Title of the print document
 * @param {Array} columns - Column configurations {header, accessor}
 */
export const printData = (data, title, columns) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error('Popup blocked. Please allow popups to print.');
        return;
    }

    const filteredCols = columns.filter(col => col.id !== 'actions');
    
    const tableHeader = filteredCols.map(col => `<th>${col.header}</th>`).join('');
    const tableRows = data.map(item => {
        const cells = filteredCols.map(col => {
            let value = item;
            const path = col.accessor.split('.');
            path.forEach(key => {
                value = value ? value[key] : '';
            });
            return `<td>${value || ''}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    printWindow.document.write(`
        <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .footer { margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <table>
                    <thead><tr>${tableHeader}</tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <div class="footer">End of Report</div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
};
