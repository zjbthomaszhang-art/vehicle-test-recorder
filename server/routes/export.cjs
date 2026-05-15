const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');

const router = express.Router();

const BORDER_STYLE = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

function getFmt(v) {
  if (!v) return '/';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '/';
  return d.toTimeString().slice(0, 8);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function drawTemplateHeaders(sheet, title, info, isApp) {
  sheet.views = [{ showGridLines: false, state: 'frozen', ySplit: 15 }];

  sheet.getCell('C2').value = title;
  sheet.getCell('C2').font = { size: 16, bold: true, name: '微软雅黑' };
  
  sheet.getCell('D5').value = '日期：';
  sheet.getCell('E5').value = info.date;
  sheet.getCell('G5').value = '测试人员：';
  sheet.getCell('H5').value = info.tester;

  sheet.getCell('D7').value = '车型：';
  sheet.getCell('E7').value = info.model;
  sheet.getCell('G7').value = 'VIN：';
  sheet.getCell('H7').value = info.vin;

  sheet.getCell('D9').value = '里程：';
  sheet.getCell('E9').value = info.mileage;
  sheet.getCell('G9').value = 'STID：';
  sheet.getCell('H9').value = info.stid;

  sheet.getCell('D11').value = '测试城市：';
  sheet.getCell('E11').value = info.city;
  
  if (isApp) {
    sheet.getCell('G11').value = '手机版本：';
    sheet.getCell('H11').value = info.appVersion;
  } else {
    sheet.getCell('G11').value = '测试地点：';
    sheet.getCell('H11').value = info.address;
  }

  [5, 7, 9, 11].forEach(r => {
    sheet.getCell(`D${r}`).font = { bold: true, name: '微软雅黑', size: 11 };
    sheet.getCell(`E${r}`).font = { bold: false, name: '微软雅黑', size: 11 };
    sheet.getCell(`G${r}`).font = { bold: true, name: '微软雅黑', size: 11 };
    sheet.getCell(`H${r}`).font = { bold: false, name: '微软雅黑', size: 11 };
    
    sheet.getCell(`D${r}`).alignment = { horizontal: 'right', vertical: 'middle' };
    sheet.getCell(`E${r}`).alignment = { horizontal: 'left', vertical: 'middle' };
    sheet.getCell(`G${r}`).alignment = { horizontal: 'right', vertical: 'middle' };
    sheet.getCell(`H${r}`).alignment = { horizontal: 'left', vertical: 'middle' };
  });

  sheet.getCell('C13').value = '详细测试数据';
  sheet.getCell('C13').font = { bold: true, size: 12, name: '微软雅黑' };

  // Set widths
  sheet.getColumn('A').width = 2;
  sheet.getColumn('B').width = 2;
  sheet.getColumn('C').width = 8;  // No.
  sheet.getColumn('D').width = 16; // 功能大类
  sheet.getColumn('E').width = 25; // 功能
  sheet.getColumn('F').width = 30; // 测试内容
  sheet.getColumn('G').width = 20; // 测试开始时间
  sheet.getColumn('H').width = 16; // 结果 / 执行时长
  sheet.getColumn('I').width = 16; // 备注 / 反馈时长
  sheet.getColumn('J').width = 14; // 最终结果
  sheet.getColumn('K').width = 25; // 备注
}
function drawThemeFrame(ws, whiteColStart, whiteColEnd, maxRow, arrowId, onstarId, bgId) {
  for (let r = 1; r <= maxRow; r++) {
    for (let c = 1; c <= whiteColEnd + 2; c++) {
      const cell = ws.getCell(r, c);
      // Skip if cell already has a fill (like table headers/data)
      if (cell.fill && cell.fill.type !== 'none') continue;

      if (r <= 3 || r >= maxRow - 2) {
        // Top and Bottom header bar
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF69AEF3' } };
        // Remove borders in margin
        cell.border = {};
      } else {
        if (c < whiteColStart) {
          // Left margin (solid blue)
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF69AEF3' } };
          cell.border = {};
        } else if (c > whiteColEnd) {
          // Right margin
          if (c === whiteColEnd + 1) {
            // Drop shadow / gradient approximation
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A98ED' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF69AEF3' } };
          }
          cell.border = {};
        } else {
          // White page background
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        }
      }
    }
  }

  if (arrowId !== undefined) {
    ws.addImage(arrowId, {
      tl: { nativeCol: 1, nativeColOff: 270510, nativeRow: 0, nativeRowOff: 440055 },
      ext: { width: 44, height: 43 },
      editAs: 'absolute' // keep image from resizing with cells
    });
  }
  if (bgId !== undefined) {
    ws.addImage(bgId, {
      tl: { nativeCol: 7, nativeColOff: 200000, nativeRow: 1, nativeRowOff: 0 },
      br: { nativeCol: 10, nativeColOff: 0, nativeRow: 3, nativeRowOff: 0 },
      editAs: 'absolute'
    });
  }
  if (onstarId !== undefined) {
    ws.addImage(onstarId, {
      tl: { nativeCol: 7, nativeColOff: 1661310, nativeRow: 0, nativeRowOff: 262741 },
      ext: { width: 176, height: 73 },
      editAs: 'absolute'
    });
  }
}

function applyDataStyles(sheet, rowNum, colCount) {
  const row = sheet.getRow(rowNum);
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i + 2); // Start from C
    cell.border = BORDER_STYLE;
    cell.font = { name: '微软雅黑', size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    
    // Left align text columns like 功能大类, 功能, 测试内容, 备注
    if (i === 2 || i === 3 || i === 4 || i === colCount) {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    }

    // Colors for result
    const val = String(cell.value || '').trim();
    if (val === 'Pass') {
      cell.font = { color: { argb: 'FF00B050' }, bold: true, name: '微软雅黑', size: 10 };
    } else if (val === 'Fail') {
      cell.font = { color: { argb: 'FFFF0000' }, bold: true, name: '微软雅黑', size: 10 };
    } else if (val === 'N/A' || val === 'NA') {
      cell.font = { color: { argb: 'FF808080' }, bold: true, name: '微软雅黑', size: 10 };
    }
  }
}

async function buildExport(req, res) {
  const { cases = [], caseResults = [], bugs = [], vehicle = {} } = req.body;
  const { vehicleModel = '', modelYear = '', vin = '', address = '', tester = '', mileage = '' } = vehicle;
  
  // Extract city from address heuristically
  let city = '';
  let location = address || '';
  if (address) {
    const cityIndex = address.indexOf('市');
    const provIndex = address.indexOf('省');
    
    if (cityIndex !== -1) {
      city = address.substring(0, cityIndex + 1);
      location = address.substring(cityIndex + 1);
    } else if (provIndex !== -1) {
      city = address.substring(0, provIndex + 1);
      location = address.substring(provIndex + 1);
    }
  }

  const info = {
    date: formatDate(new Date()),
    tester: tester || '',
    model: `${modelYear ? 'MY' + modelYear : ''} ${vehicleModel}`.trim(),
    vin: vin || '',
    mileage: mileage ? `${mileage}KM` : '',
    stid: '',
    city: city,
    address: location,
    appVersion: ''
  };

  const workbook = new ExcelJS.Workbook();
  
  let arrowId;
  let onstarId;
  let bgId;
  try {
    arrowId = workbook.addImage({ filename: path.join(__dirname, '../assets/arrow.png'), extension: 'png' });
    onstarId = workbook.addImage({ filename: path.join(__dirname, '../assets/安吉星.png'), extension: 'png' });
    bgId = workbook.addImage({ filename: path.join(__dirname, '../assets/渐变色底图.png'), extension: 'png' });
  } catch (e) {
    console.error('Error loading images:', e);
  }
  
function applyCoverAndTocSizing(ws, isCover) {
  const colWidths = [
    5.125, 6.625, 10.625, 14.625, 25.375, 32.375, 17.375, 25.625, 13, 6.625, 0.625, 4.625, 
    12.625, 12.625, 12.625, 12.625, 12.625, 12.625, 12.625, 12.625
  ];
  colWidths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const coverHeights = [35.1, 30, 24.95, 30, 30, 15, 30, 15, 30, 15, 30, 30, 39.95, 15, 45.95];
  const tocHeights = [35.1, 30, 24.95, 30, 15, 30, 15, 30, 15, 30, 30, 39.95, 15, 45.95, 39, 50.1, 39, 39];
  const heights = isCover ? coverHeights : tocHeights;

  for (let r = 1; r <= 50; r++) {
    const row = ws.getRow(r);
    row.height = heights[r - 1] !== undefined ? heights[r - 1] : 30;
  }
}

  // --- Cover Page ---
  const wsCover = workbook.addWorksheet('Cover page');
  wsCover.views = [{ showGridLines: false }];
  applyCoverAndTocSizing(wsCover, true);
  
  const pureModel = vehicleModel ? vehicleModel.replace(/^MY\d{2}\s*/i, '').replace(/^U/i, '') : '557';
  
  wsCover.mergeCells('D11:H12');
  const covTitle = wsCover.getCell('D11');
  covTitle.value = `${pureModel}车辆手机APP验证测试`;
  covTitle.font = { size: 36, bold: true, name: '微软雅黑', color: { argb: 'FF404040' } };
  covTitle.alignment = { vertical: 'middle', horizontal: 'left' };
  
  wsCover.mergeCells('D13:H13');
  const covSub = wsCover.getCell('D13');
  covSub.value = `${pureModel} Vehicle Mobile APP Validation Test`;
  covSub.font = { size: 18, name: '微软雅黑 Light', color: { argb: 'FF404040' } };
  covSub.alignment = { vertical: 'middle', horizontal: 'left' };
  
  for (let c = 4; c <= 8; c++) {
    wsCover.getRow(14).getCell(c).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
  }

  const d = new Date();
  wsCover.mergeCells('D16:H16');
  const covDate = wsCover.getCell('D16');
  covDate.value = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  covDate.font = { size: 18, name: '微软雅黑', color: { argb: 'FF404040' } };
  covDate.alignment = { vertical: 'middle', horizontal: 'left' };

  drawThemeFrame(wsCover, 2, 10, 53, arrowId, onstarId, bgId);

  // --- Table of contents ---
  const wsToc = workbook.addWorksheet('Table of contents-->');
  wsToc.views = [{ showGridLines: false }];
  applyCoverAndTocSizing(wsToc, false);
  
  wsToc.getCell('C9').value = 'Table of Contents';
  wsToc.getCell('C9').font = { size: 16, bold: true, name: '微软雅黑' };
  
  for (let c = 3; c <= 8; c++) {
    wsToc.getRow(10).getCell(c).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
  }

  wsToc.getCell('C12').value = 'Contents';
  wsToc.getCell('C12').font = { size: 14, bold: true, name: '微软雅黑' };

  const tocLinks = [
    { row: 14, text: '车辆服务', target: "'车辆服务'!A1" },
    { row: 15, text: '手机APP-iOS', target: "'手机APP-iOS'!A1" },
    { row: 16, text: '手机APP-Android', target: "'手机APP-Android'!A1" },
    { row: 17, text: 'SGM问题清单', target: "'SGM问题清单'!A1" },
    { row: 18, text: '截图', target: "'截图'!A1" }
  ];

  tocLinks.forEach((link) => {
    const cell = wsToc.getCell(`C${link.row}`);
    cell.value = { text: link.text, hyperlink: `#${link.target}` };
    cell.font = { size: 12, name: '微软雅黑', color: { argb: 'FF0563C1' }, underline: true };
  });

  drawThemeFrame(wsToc, 2, 10, 53, arrowId, onstarId, bgId);

  // --- 车辆服务 Sheet ---
  const wsVehicle = workbook.addWorksheet('车辆服务');
  drawTemplateHeaders(wsVehicle, `${vehicleModel}车辆手机APP验证测试- 车辆服务`, info, false);
  
  // Header Row 15
  const vHeaders = ["No.", "功能大类", "功能", "测试内容", "测试时间\\n测试开始时间         ", "最终结果:\\nPass/Fail", "备注"];
  const vRow15 = wsVehicle.getRow(15);
  vRow15.height = 35;
  vHeaders.forEach((h, idx) => {
    const cell = vRow15.getCell(idx + 3);
    cell.value = h.replace(/\\n/g, '\n');
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
    cell.font = { bold: true, name: '微软雅黑', size: 10 };
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  const vehicleRows = cases.map((c, i) => ({ c, r: caseResults[i] || {} })).filter(({ c }) => c.category === '车辆服务');
  vehicleRows.forEach(({ c, r }, idx) => {
    const rNum = 16 + idx;
    const row = wsVehicle.getRow(rNum);
      row.getCell('C').value = idx + 1;
    row.getCell('D').value = c.function_category || c.functionCategory || c.category || '';
    row.getCell('E').value = c.function || '';
    row.getCell('F').value = c.expected || '';
    row.getCell('G').value = getFmt(r.startTime || r.start_time);
    row.getCell('H').value = r.result || '/';
    row.getCell('I').value = r.notes || '';
    applyDataStyles(wsVehicle, rNum, 7);
  });

  drawThemeFrame(wsVehicle, 3, 11, Math.max(60, wsVehicle.rowCount + 10), arrowId, onstarId, bgId);

  // --- 手机APP Sheets ---
  const addAppSheetWithData = (sheetName, titleSuffix) => {
    const wsApp = workbook.addWorksheet(sheetName);
    drawTemplateHeaders(wsApp, `${vehicleModel}车辆手机APP验证测试- ${titleSuffix}`, info, true);
    
    const aHeaders = ["No.", "功能大类", "功能", "测试内容", "测试开始时间        ", "车辆执行时长/秒", "APP反馈时长/秒", "最终结果:\\nPass/Fail", "备注"];
    const aRow15 = wsApp.getRow(15);
    aRow15.height = 35;
    aHeaders.forEach((h, idx) => {
      const cell = aRow15.getCell(idx + 3);
      cell.value = h.replace(/\\n/g, '\n');
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
      cell.font = { bold: true, name: '微软雅黑', size: 10 };
      cell.border = BORDER_STYLE;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    const appRows = cases.map((c, i) => ({ c, r: caseResults[i] || {} })).filter(({ c }) => c.category === '手机应用' && (c.function_category || c.functionCategory) === sheetName);
    appRows.forEach(({ c, r }, idx) => {
      const rNum = 16 + idx;
      const row = wsApp.getRow(rNum);
      
      const startVal = r.startTime || r.start_time;
      const carVal   = r.carExecTime || r.car_exec_time;
      const appVal   = r.appFeedbackTime || r.app_feedback_time;
      const startMs  = startVal ? new Date(startVal).getTime() : null;
      const carMs    = carVal ? new Date(carVal).getTime() : null;
      const appMs    = appVal ? new Date(appVal).getTime() : null;

      const carDur = (startMs && carMs && !isNaN(startMs) && !isNaN(carMs)) ? Number(((carMs - startMs) / 1000).toFixed(2)) : '/';
      const appDur = (startMs && appMs && !isNaN(startMs) && !isNaN(appMs)) ? Number(((appMs - startMs) / 1000).toFixed(2)) : '/';

        row.getCell('C').value = idx + 1;
      row.getCell('D').value = c.function_category || c.functionCategory || c.category || '';
      row.getCell('E').value = c.function || '';
      row.getCell('F').value = c.expected || '';
      row.getCell('G').value = getFmt(startVal);
      row.getCell('H').value = carDur;
      row.getCell('I').value = appDur;
      row.getCell('J').value = r.result || '/';
      row.getCell('K').value = r.notes || '';
      applyDataStyles(wsApp, rNum, 9);
    });

    drawThemeFrame(wsApp, 3, 11, Math.max(60, wsApp.rowCount + 10), arrowId, onstarId, bgId);
  };

  addAppSheetWithData('手机APP-iOS', '手机APP-iOS');
  addAppSheetWithData('手机APP-Android', '手机APP-Android');

  // --- SGM 问题清单 ---
  const wsBugs = workbook.addWorksheet('SGM问题清单');
  wsBugs.views = [{ state: 'frozen', ySplit: 3 }];
  
  // Title Row
  wsBugs.mergeCells('A1:V1');
  const bugTitle = wsBugs.getCell('A1');
  bugTitle.value = 'Onstar功能测试问题清单';
  bugTitle.font = { size: 16, bold: true, name: '微软雅黑' };
  bugTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsBugs.getRow(1).height = 30;

  const bugCols = [
    { key: 'id', title: 'ID', width: 5, color: 'FFDDEBF7' },
    { key: 'model', title: '车型\\nmotorcycle type', width: 10, color: 'FFDDEBF7' },
    { key: 'phase', title: '生产阶段\\nBuild Phase', width: 10, color: 'FFDDEBF7' },
    { key: 'source', title: '问题来源\\nSource', width: 10, color: 'FFDDEBF7' },
    { key: 'loc', title: '试验地点\\nTest Place', width: 15, color: 'FFDDEBF7' },
    { key: 'vin', title: 'VIN', width: 22, color: 'FFDDEBF7' },
    { key: 'mil', title: '里程数\\nOdo.', width: 12, color: 'FFDDEBF7' },
    { key: 'finder', title: '发现人\\nFinder', width: 10, color: 'FFDDEBF7' },
    { key: 'approve', title: '问题审批\\nApprove', width: 10, color: 'FFDDEBF7' },
    { key: 'date', title: '问题提出日期\\nIssue Identify Date', width: 14, color: 'FFDDEBF7' },
    { key: 'time', title: '问题提出时间\\nIssue Identify Time', width: 14, color: 'FFDDEBF7' },
    { key: 'smt', title: 'SMT', width: 8, color: 'FFDDEBF7', parent: '问题描述\\nVerbatim(Issue Explained)' },
    { key: 'desc', title: '详细描述', width: 40, color: 'FFDDEBF7', parent: '问题描述\\nVerbatim(Issue Explained)' },
    { key: 'defect', title: '缺陷模式', width: 12, color: 'FFDDEBF7', parent: '问题描述\\nVerbatim(Issue Explained)' },
    { key: 'note', title: '备注', width: 15, color: 'FFDDEBF7' },
    { key: 'rate', title: '问题严重性\\nRate', width: 10, color: 'FFDDEBF7' },
    { key: 'pic', title: '详图\\nPicture', width: 10, color: 'FFDDEBF7' },
    { key: 'freq', title: '频次\\nFrequence', width: 10, color: 'FFDDEBF7' },
    { key: 'dept', title: '责任部门', width: 12, color: 'FFFFC000' },
    { key: 'pqe', title: 'PQE', width: 10, color: 'FFFFC000' },
    { key: 'sup', title: '供应商\\nSupplier', width: 12, color: 'FFFFC000' },
    { key: 'status', title: '调查状态\\nAnalysis Process', width: 15, color: 'FFFFC000' }
  ];

  wsBugs.columns = bugCols.map(c => ({ key: c.key, width: c.width }));
  
  const r2 = wsBugs.getRow(2);
  const r3 = wsBugs.getRow(3);
  r2.height = 30;
  r3.height = 25;

  let colIdx = 1;
  bugCols.forEach((c) => {
    if (c.parent) {
      r3.getCell(colIdx).value = c.title.replace(/\\n/g, '\n');
    } else {
      wsBugs.mergeCells(2, colIdx, 3, colIdx);
      r2.getCell(colIdx).value = c.title.replace(/\\n/g, '\n');
    }
    
    // Style both rows for safety
    [r2.getCell(colIdx), r3.getCell(colIdx)].forEach(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.color } };
      cell.border = BORDER_STYLE;
      cell.font = { size: 9, bold: true, name: '微软雅黑' };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    colIdx++;
  });

  // Merge the parent "问题描述" header across columns 12, 13, 14
  wsBugs.mergeCells(2, 12, 2, 14);
  const descHeader = wsBugs.getCell(2, 12);
  descHeader.value = '问题描述\nVerbatim(Issue Explained)';
  descHeader.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  bugs.forEach((bug, i) => {
    const d = bug.timestamp ? new Date(bug.timestamp) : new Date();
    wsBugs.addRow({
      id: i + 1,
      model: `${modelYear ? 'MY' + modelYear : ''} ${vehicleModel}`.trim() || '557',
      phase: '',
      source: '',
      loc: location,
      vin: vin,
      mil: mileage ? `${mileage}KM` : '',
      finder: tester,
      approve: '',
      date: `${d.getMonth() + 1}月${d.getDate()}日`,
      time: d.toTimeString().slice(0, 5),
      smt: '',
      desc: bug.description,
      defect: '',
      note: '',
      rate: '',
      pic: '',
      freq: '',
      dept: '',
      pqe: '',
      sup: '',
      status: ''
    });
    
    // Apply borders and font to data row
    const row = wsBugs.lastRow;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= bugCols.length) {
        cell.border = BORDER_STYLE;
        cell.font = { size: 9, name: '微软雅黑' };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        if (colNumber === 13) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }
      }
    });
  });

  // --- 截图 ---
  const wsScreenshots = workbook.addWorksheet('截图');
  wsScreenshots.columns = [
    { header: '功能名称',  key: 'func', width: 30 },
    { header: '截图序号',  key: 'idx',  width: 12 },
    { header: '截图地址',  key: 'url',  width: 100 },
  ];
  const shotHeader = wsScreenshots.getRow(1);
  shotHeader.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF44546A' } };
    c.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  cases.forEach((c, idx) => {
    const media = (caseResults[idx] || {}).media || [];
    media.forEach((m, mIdx) => {
      wsScreenshots.addRow({ func: c.function, idx: mIdx + 1, url: m.url || '' });
    });
  });

  // --- Response ---
  const safeModel = (vehicleModel || 'Report').replace(/[^a-z0-9]/gi, '_');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `${dateStr}_VehicleTest_${safeModel}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  
  await workbook.xlsx.write(res);
  res.end();
}

router.post('/excel', async (req, res) => {
  try {
    await buildExport(req, res);
  } catch (err) {
    console.error('[export] ExcelJS Error:', err);
    res.status(500).send('Error generating report');
  }
});

module.exports = router;
