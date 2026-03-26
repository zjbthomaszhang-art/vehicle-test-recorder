const express = require('express');
const ExcelJS = require('exceljs');

const router = express.Router();

// Professional colors
const COLOR_HEADER_BG = 'FF44546A';
const COLOR_HEADER_TEXT = 'FFFFFFFF';
const COLOR_PASS = 'FF00B050'; // Green
const COLOR_FAIL = 'FFFF0000'; // Red
const COLOR_NA   = 'FF808080'; // Gray

const BORDER_STYLE = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_HEADER_BG },
    };
    cell.font = {
      color: { argb: COLOR_HEADER_TEXT },
      bold: true,
      size: 11,
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER_STYLE;
  });
  row.height = 25;
}

function applyDataStyle(sheet, startRow = 2) {
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber < startRow) return;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = BORDER_STYLE;
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      // Highlight Result column
      const headerCell = sheet.getRow(startRow - 1).getCell(colNumber);
      const headerText = String(headerCell ? headerCell.value : '');

      if (headerText.includes('Result / 结果')) {
        const val = String(cell.value || '').trim();
        if (val === 'Pass') {
          cell.font = { color: { argb: COLOR_PASS }, bold: true };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (val === 'Fail') {
          cell.font = { color: { argb: COLOR_FAIL }, bold: true };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (val === 'N/A') {
          cell.font = { color: { argb: COLOR_NA }, bold: true };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      } else if (headerText.includes('Time') || headerText.includes('Duration')) {
        cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };
      }
    });
  });
}

function getFmt(v) {
  return (v && !isNaN(new Date(v).getTime())) ? new Date(v).toTimeString().slice(0, 8) : '';
}

async function addVehicleSheet(workbook, rows) {
  const sheet = workbook.addWorksheet('车辆服务', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheet.columns = [
    { header: 'No.', key: 'no', width: 6 },
    { header: 'Case ID', key: 'id', width: 10 },
    { header: 'Category / 类别', key: 'cat', width: 15 },
    { header: 'Function Category / 功能分类', key: 'funcCat', width: 22 },
    { header: 'Function / 功能', key: 'func', width: 25 },
    { header: 'Content / 测试内容', key: 'content', width: 40 },
    { header: 'Start Time', key: 'time', width: 15 },
    { header: 'Result / 结果', key: 'result', width: 12 },
    { header: 'Notes / 备注', key: 'notes', width: 50 },
  ];

  rows.forEach(({ c, r }, i) => {
    sheet.addRow({
      no: i + 1,
      id: c.id,
      cat: c.category || '',
      funcCat: c.function_category || c.functionCategory || '',
      func: c.function || '',
      content: c.content || '',
      time: getFmt(r.startTime || r.start_time),
      result: r.result || '',
      notes: r.notes || '',
    });
  });

  styleHeader(sheet.getRow(1));
  applyDataStyle(sheet);
  sheet.autoFilter = 'A1:I1';
}

async function addAppSheet(workbook, name, rows) {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheet.columns = [
    { header: 'No.', key: 'no', width: 6 },
    { header: 'Case ID', key: 'id', width: 10 },
    { header: 'Category / 类别', key: 'cat', width: 15 },
    { header: 'Function Category / 功能分类', key: 'funcCat', width: 22 },
    { header: 'Function / 功能', key: 'func', width: 25 },
    { header: 'Content / 测试内容', key: 'content', width: 40 },
    { header: 'Start Time', key: 'time', width: 15 },
    { header: 'Car Exec Time', key: 'carT', width: 15 },
    { header: 'App Feedback Time', key: 'appT', width: 15 },
    { header: 'Car Duration (s)', key: 'carD', width: 14 },
    { header: 'App Duration (s)', key: 'appD', width: 14 },
    { header: 'Result / 结果', key: 'result', width: 12 },
    { header: 'Notes / 备注', key: 'notes', width: 50 },
  ];

  rows.forEach(({ c, r }, i) => {
    const startVal = r.startTime || r.start_time;
    const carVal   = r.carExecTime || r.car_exec_time;
    const appVal   = r.appFeedbackTime || r.app_feedback_time;
    const startMs  = startVal ? new Date(startVal).getTime() : null;
    const carMs    = carVal ? new Date(carVal).getTime() : null;
    const appMs    = appVal ? new Date(appVal).getTime() : null;

    const carDur = (startMs && carMs && !isNaN(startMs) && !isNaN(carMs)) ? Number(((carMs - startMs) / 1000).toFixed(2)) : '';
    const appDur = (startMs && appMs && !isNaN(startMs) && !isNaN(appMs)) ? Number(((appMs - startMs) / 1000).toFixed(2)) : '';

    sheet.addRow({
      no: i + 1,
      id: c.id,
      cat: c.category || '',
      funcCat: c.function_category || c.functionCategory || '',
      func: c.function || '',
      content: c.content || '',
      time: getFmt(startVal),
      carT: getFmt(carVal),
      appT: getFmt(appVal),
      carD: carDur,
      appD: appDur,
      result: r.result || '',
      notes: r.notes || '',
    });
  });

  styleHeader(sheet.getRow(1));
  applyDataStyle(sheet);
  sheet.autoFilter = 'A1:M1';
}

function setColWidths(ws, widths) {
  // Dummy to avoid errors if called, though we'll use sheet.columns
}

/**
 * POST /api/export/excel
 * Body: { cases, caseResults, bugs, vehicle }
 * Returns: xlsx binary stream with Content-Disposition: attachment
 */
router.post('/excel', async (req, res) => {
  try {
    const { cases = [], caseResults = [], bugs = [], vehicle = {} } = req.body;
    const { vehicleModel, modelYear, vin, address, architecture, iviModule, commModule, tester, mileage } = vehicle;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vehicle Test Recorder';
    workbook.lastModifiedBy = 'Vehicle Test Recorder';
    workbook.created = new Date();

    // --- Cover Page Dashboard ---
    const wsCover = workbook.addWorksheet('Cover Page');
    wsCover.views = [{ showGridLines: false }];
    wsCover.properties.defaultRowHeight = 24;

    // Helper for cards
    const drawCard = (ws, r1, c1, r2, c2, bg = 'FFFFFFFF', borderCol = 'FFD9D9D9', hasBorder = true) => {
      if (r1 !== r2 || c1 !== c2) ws.mergeCells(r1, c1, r2, c2);
      const cell = ws.getCell(r1, c1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      if (hasBorder) {
        cell.border = {
          top: { style: 'thin', color: { argb: borderCol } },
          left: { style: 'thin', color: { argb: borderCol } },
          bottom: { style: 'thin', color: { argb: borderCol } },
          right: { style: 'thin', color: { argb: borderCol } },
        };
      }
      return cell;
    };

    // 1. Header
    wsCover.getRow(2).height = 45;
    const cellTitle = wsCover.getCell(2, 2);
    cellTitle.value = 'Summary';
    cellTitle.font = { size: 36, bold: true, italic: true, color: { argb: 'FF1A1C1E' } };
    
    const dateStr = new Date().toLocaleDateString('en-CA').replace(/-/g, '/');
    const cellSub = wsCover.getCell(3, 2);
    cellSub.value = `VALIDATION TEST REPORT • ${dateStr}`;
    cellSub.font = { size: 11, color: { argb: 'FF8E9196' }, bold: true };

    // 2. Info Block (Airier table)
    const infoRows = [
      ['YEAR / MODEL / VIN', `${modelYear ? 'MY' + modelYear : ''} / ${vehicleModel || ''} / ${vin || ''}`],
      ['SYSTEM ARCH CONFIG', architecture || 'GA - INFO - TCP'],
      ['TESTING ADDRESS',    address || 'sh'],
      ['TESTER',             tester || 'tester'],
    ];
    infoRows.forEach((pair, idx) => {
      const r = 5 + (idx * 2);
      wsCover.mergeCells(r, 2, r, 3);
      const row = wsCover.getRow(r);
      row.height = 30;
      row.getCell(2).value = pair[0];
      row.getCell(2).font = { size: 9, color: { argb: 'FFB0B3B8' }, bold: true };
      row.getCell(3).value = pair[1];
      row.getCell(3).font = { size: 11, bold: true, color: { argb: 'FF1A1C1E' } };
      row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
      // Bottom border for separator
      row.getCell(2).border = { bottom: { style: 'thin', color: { argb: 'FFF0F0F0' } } };
      row.getCell(3).border = { bottom: { style: 'thin', color: { argb: 'FFF0F0F0' } } };
    });

    // 3. Stats Tiles
    const totalPass = caseResults.filter(r => r.result === 'Pass').length;
    const totalFail = caseResults.filter(r => r.result === 'Fail').length;
    const totalNA   = caseResults.filter(r => r.result === 'N/A').length;

    // Grid layout for tiles
    const statsRow = 15;
    wsCover.getRow(statsRow).height = 80;

    // Total
    const cTot = drawCard(wsCover, statsRow, 2, statsRow, 2, 'FF2B60E2', 'FF2B60E2');
    cTot.richText = [
      { text: `${cases.length}\n`, font: { size: 28, color: { argb: 'FFFFFFFF' }, bold: true } },
      { text: 'TOTAL CASES', font: { size: 9, color: { argb: 'FFFFFFFF' }, bold: true } }
    ];
    cTot.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };

    // Bugs
    const cBug = drawCard(wsCover, statsRow, 3, statsRow, 3, 'FFFFFFFF', 'FFF0F0F0');
    cBug.richText = [
      { text: `${bugs.length}\n`, font: { size: 28, color: { argb: 'FFFF4D4D' }, bold: true } },
      { text: 'OPEN BUGS', font: { size: 9, color: { argb: 'FF8E9196' }, bold: true } }
    ];
    cBug.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };

    // Row 17 for small badges
    const badgeRow = 17;
    wsCover.getRow(badgeRow).height = 35;
    
    const bPass = drawCard(wsCover, badgeRow, 2, badgeRow, 2, 'FFF0FFF0', 'FFC6EFCE');
    bPass.value = `PASS ${totalPass}`;
    bPass.font = { size: 11, bold: true, color: { argb: 'FF00B050' } };
    bPass.alignment = { horizontal: 'center', vertical: 'middle' };

    const bFail = drawCard(wsCover, badgeRow, 3, badgeRow, 3, 'FFFFF0F0', 'FFFFCCCC');
    bFail.value = `FAIL ${totalFail}`;
    bFail.font = { size: 11, bold: true, color: { argb: 'FFFF0000' } };
    bFail.alignment = { horizontal: 'center', vertical: 'middle' };

    const bNA = drawCard(wsCover, badgeRow, 4, badgeRow, 4, 'FFF5F5F5', 'FFD9D9D9');
    bNA.value = `N/A ${totalNA}`;
    bNA.font = { size: 11, bold: true, color: { argb: 'FF808080' } };
    bNA.alignment = { horizontal: 'center', vertical: 'middle' };

    wsCover.getColumn(1).width = 4;
    wsCover.getColumn(2).width = 30;
    wsCover.getColumn(3).width = 40;
    wsCover.getColumn(4).width = 20;

    // --- Sheets ---
    const vehicleRows = cases.map((c, i) => ({ c, r: caseResults[i] || {} })).filter(({ c }) => c.category === '车辆服务');
    await addVehicleSheet(workbook, vehicleRows);

    const iosRows = cases.map((c, i) => ({ c, r: caseResults[i] || {} })).filter(({ c }) => c.category === '手机应用' && (c.function_category || c.functionCategory) === '手机APP-iOS');
    await addAppSheet(workbook, '手机APP-iOS', iosRows);

    const androidRows = cases.map((c, i) => ({ c, r: caseResults[i] || {} })).filter(({ c }) => c.category === '手机应用' && (c.function_category || c.functionCategory) === '手机APP-Android');
    await addAppSheet(workbook, '手机APP-Android', androidRows);

    // --- SGM 问题清单 ---
    const wsBugs = workbook.addWorksheet('SGM问题清单', { views: [{ state: 'frozen', ySplit: 1 }] });
    wsBugs.columns = [
      { header: '序号', key: 'no', width: 8 },
      { header: '测试车型', key: 'model', width: 25 },
      { header: 'VIN', key: 'vin', width: 20 },
      { header: '测试地点', key: 'loc', width: 22 },
      { header: '里程数 (KM)', key: 'mil', width: 14 },
      { header: '发现人', key: 'user', width: 12 },
      { header: '问题提出时间', key: 'time', width: 20 },
      { header: '问题描述', key: 'desc', width: 60 },
    ];
    bugs.forEach((bug, i) => {
      wsBugs.addRow({
        no: i + 1,
        model: `MY${modelYear} ${vehicleModel}`,
        vin, loc: address, mil: mileage, user: tester,
        time: bug.timestamp ? String(bug.timestamp).substring(0, 16) : '',
        desc: bug.description,
      });
    });
    styleHeader(wsBugs.getRow(1));
    applyDataStyle(wsBugs);
    wsBugs.autoFilter = 'A1:H1';

    // --- Screenshots ---
    const wsScreenshots = workbook.addWorksheet('截图');
    wsScreenshots.columns = [
      { header: 'Case ID', key: 'id', width: 12 },
      { header: 'Function / 功能', key: 'func', width: 30 },
      { header: 'Photo Index', key: 'idx', width: 15 },
      { header: 'Photo URL / Data', key: 'url', width: 100 },
    ];
    cases.forEach((c, idx) => {
      const media = (caseResults[idx] || {}).media || [];
      media.forEach((m, mIdx) => {
        wsScreenshots.addRow({ id: c.id, func: c.function, idx: mIdx + 1, url: m.url || '' });
      });
    });
    styleHeader(wsScreenshots.getRow(1));
    applyDataStyle(wsScreenshots);

    // --- Response ---
    const safeModel = (vehicleModel || 'Report').replace(/[^a-z0-9]/gi, '_');
    const date = new Date().toISOString().slice(0, 10);
    const filename = `VehicleTest_${safeModel}_${date}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[export] ExcelJS Error:', err);
    res.status(500).send('Error generating beautified report');
  }
});

module.exports = router;
