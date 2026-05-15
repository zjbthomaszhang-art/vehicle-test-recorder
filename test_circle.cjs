const ExcelJS = require('exceljs');
async function run() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Test');
  
  const colWidths = [
    5.125, 6.625, 10.625, 14.625, 25.375, 32.375, 17.375, 25.625, 13, 6.625, 0.625, 4.625, 
    12.625, 12.625, 12.625, 12.625, 12.625, 12.625, 12.625, 12.625
  ];
  colWidths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const heights = [35.1, 30, 24.95, 30, 30, 15, 30, 15, 30, 15, 30, 30, 39.95, 15];
  for (let r = 1; r <= 14; r++) {
    const row = ws.getRow(r);
    row.height = heights[r - 1];
  }
  
  // Set backgrounds to see the edge
  ws.getCell('B12').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF69AEF3' } };
  ws.getCell('C12').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  ws.getCell('I12').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  ws.getCell('J12').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF69AEF3' } };
  
  ws.getCell('B13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF69AEF3' } };
  ws.getCell('C13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  ws.getCell('I13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  ws.getCell('J13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF69AEF3' } };

  // dashed line
  for(let c = 3; c <= 9; c++) {
    ws.getCell(12, c).border = { bottom: { style: 'dashed', color: { argb: 'FF8EA9DB' } } };
  }

  const circleId = wb.addImage({ filename: 'c:/Users/HG/.gemini/antigravity/scratch/vehicle-test-recorder/server/assets/圆.png', extension: 'png' });

  // Left circle
  ws.addImage(circleId, {
    tl: { nativeCol: 1, nativeColOff: 342900, nativeRow: 11, nativeRowOff: 238125 },
    ext: { width: 30, height: 30 },
    editAs: 'absolute'
  });

  // Right circle
  // I is Col 9 (nativeCol: 8). Width is 13. 96px width. 81px offset.
  ws.addImage(circleId, {
    tl: { nativeCol: 8, nativeColOff: 771525, nativeRow: 11, nativeRowOff: 238125 },
    ext: { width: 30, height: 30 },
    editAs: 'absolute'
  });

  await wb.xlsx.writeFile('test_circle.xlsx');
  console.log('done');
}
run();
