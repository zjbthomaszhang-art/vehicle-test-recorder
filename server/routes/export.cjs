const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { db } = require('../db.cjs');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[export] sharp 未安装，图片二次压缩不可用');
}

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
  sheet.views = [{ showGridLines: false }];

  const colWidths = [
    5.125, 6.625, 10.625, 14.625, 25.375, 32.375, 17.375, 25.625, 13, 6.625, 0.625, 4.625, 
    12.625, 12.625, 12.625, 12.625, 12.625, 12.625, 12.625, 12.625
  ];
  colWidths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  const heights = [35.1, 30, 24.95, 30, 30, 15, 30, 15, 30, 15, 30, 30, 39.95, 15];
  for (let r = 1; r <= 14; r++) {
    const row = sheet.getRow(r);
    row.height = heights[r - 1];
  }

  sheet.getCell('C2').value = title;
  sheet.getCell('C2').font = { size: 28, color: { argb: 'FFFFFFFF' }, name: '微软雅黑' };
  sheet.getCell('C2').alignment = { horizontal: 'left', vertical: 'middle', indent: 2 };
  
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
    sheet.getCell('G11').value = info.versionLabel || '手机版本：';
    sheet.getCell('H11').value = info.appVersion;
  } else {
    sheet.getCell('G11').value = '测试地点：';
    sheet.getCell('H11').value = info.address;
  }

  [5, 7, 9, 11].forEach(r => {
    const fontLabel = { bold: true, name: '微软雅黑', size: 11, color: { argb: 'FF404040' } };
    const fontValue = { bold: false, name: '微软雅黑', size: 11, color: { argb: 'FF404040' } };
    
    const valFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6FAFD' } };
    const valBorder = {
      left: { style: 'thin', color: { argb: 'FFDAEEF3' } },
      top: { style: 'thin', color: { argb: 'FFDAEEF3' } }
    };

    sheet.getCell(`D${r}`).font = fontLabel;
    sheet.getCell(`D${r}`).alignment = { horizontal: 'right', vertical: 'middle' };

    sheet.getCell(`G${r}`).font = fontLabel;
    sheet.getCell(`G${r}`).alignment = { horizontal: 'right', vertical: 'middle' };

    sheet.getCell(`E${r}`).font = fontValue;
    sheet.getCell(`E${r}`).fill = valFill;
    sheet.getCell(`E${r}`).border = valBorder;
    sheet.getCell(`E${r}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    sheet.getCell(`H${r}`).font = fontValue;
    sheet.getCell(`H${r}`).fill = valFill;
    sheet.getCell(`H${r}`).border = valBorder;
    sheet.getCell(`H${r}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  });

  const dashedEndCol = isApp ? 11 : 9;
  for (let c = 3; c <= dashedEndCol; c++) {
    sheet.getCell(12, c).border = { bottom: { style: 'dashed', color: { argb: 'FF8EA9DB' } } };
  }

  sheet.getCell('C13').value = '详细测试数据';
  sheet.getCell('C13').font = { size: 15, color: { argb: 'FF404040' }, name: '微软雅黑' };
}
function drawThemeFrame(ws, whiteColStart, whiteColEnd, maxRow, arrowId, onstarId, bgId, circleId, leftCircleId, rightMarginCol, bottomMarginRows, rightCircleNativeCol, rightCircleColOff, logoNativeCol, logoColOff, bgBrCol) {
  const rMarginCol = rightMarginCol || (whiteColEnd + 2);
  const bMarginRows = bottomMarginRows || 3;

  for (let r = 1; r <= maxRow; r++) {
    for (let c = 1; c <= rMarginCol; c++) {
      const cell = ws.getCell(r, c);
      // Skip if cell already has a fill (like table headers/data)
      if (cell.fill && cell.fill.type !== 'none') continue;

      if (r <= 3 || r > maxRow - bMarginRows) {
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
            // Horizontal gradient
            cell.fill = {
              type: 'gradient',
              gradient: 'linear',
              degree: 0,
              stops: [
                { position: 0, color: { argb: 'FF4A98ED' } },
                { position: 1, color: { argb: 'FF69AEF3' } }
              ]
            };
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
      tl: { nativeCol: 7, nativeColOff: 0, nativeRow: 1, nativeRowOff: 0 },
      br: { nativeCol: bgBrCol !== undefined ? bgBrCol : 9, nativeColOff: 0, nativeRow: 3, nativeRowOff: 0 },
      editAs: 'absolute'
    });
  }
  if (onstarId !== undefined) {
    ws.addImage(onstarId, {
      tl: { nativeCol: logoNativeCol !== undefined ? logoNativeCol : 7, nativeColOff: logoColOff !== undefined ? logoColOff : 1661310, nativeRow: 0, nativeRowOff: 262741 },
      ext: { width: 176, height: 73 },
      editAs: 'absolute'
    });
  }
  if (circleId !== undefined) {
    ws.addImage(circleId, {
      tl: { nativeCol: rightCircleNativeCol !== undefined ? rightCircleNativeCol : 9, nativeColOff: rightCircleColOff !== undefined ? rightCircleColOff : 435768, nativeRow: 11, nativeRowOff: 238125 },
      ext: { width: 30, height: 30 },
      editAs: 'absolute'
    });
  }
  if (leftCircleId !== undefined) {
    ws.addImage(leftCircleId, {
      tl: { nativeCol: 0, nativeColOff: 246459, nativeRow: 11, nativeRowOff: 238125 },
      ext: { width: 30, height: 30 },
      editAs: 'absolute'
    });
  }
}

function applyDataStyles(sheet, rowNum, colCount) {
  const row = sheet.getRow(rowNum);
  row.height = 30;
  
  const noCell = row.getCell(3);
  const noVal = parseInt(noCell.value, 10);
  const isEven = !isNaN(noVal) && noVal % 2 === 0;
  const fillColor = isEven ? 'FFF2F2F2' : 'FFFFFFFF';

  for (let i = 1; i <= colCount; i++) {
    const cIdx = i + 2; // Start from C
    const cell = row.getCell(cIdx);
    cell.border = {
      left: { style: 'thin', color: { argb: 'FFE6E6E6' } },
      right: { style: 'thin', color: { argb: 'FFE6E6E6' } }
    };
    cell.font = { name: '微软雅黑', size: 10, color: { argb: 'FF404040' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    
    let align = { vertical: 'middle', horizontal: 'center', wrapText: true };
    if (colCount === 7) {
      if ([4, 5, 6].includes(cIdx)) align.horizontal = 'left';
      else if (cIdx === 7) align.horizontal = 'right';
      else if (cIdx === 8) align.horizontal = 'center';
    } else {
      if ([4, 5, 6, 11].includes(cIdx)) align.horizontal = 'left';
      else if (cIdx === 7) align.horizontal = 'right';
    }
    cell.alignment = align;

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
  const { cases: rawCases = [], caseResults: rawCaseResults = [], bugs = [], vehicle = {} } = req.body;

  // Fetch original sort_order from Case Management (cases table) to ensure consistent order
  let dbSortOrderMap = new Map();
  try {
    const [dbCases] = await db.query("SELECT id, sort_order FROM cases");
    dbCases.forEach(c => dbSortOrderMap.set(Number(c.id), Number(c.sort_order || 0)));
  } catch (err) {
    console.error("Error fetching db cases for sorting:", err);
  }

  const paired = rawCases.map((c, i) => ({ c, r: rawCaseResults[i] || {} }));
  paired.sort((a, b) => {
    const idA = Number(a.c.original_case_id || a.c.id);
    const idB = Number(b.c.original_case_id || b.c.id);
    const sortA = dbSortOrderMap.has(idA) ? dbSortOrderMap.get(idA) : Number(a.c.sort_order || 0);
    const sortB = dbSortOrderMap.has(idB) ? dbSortOrderMap.get(idB) : Number(b.c.sort_order || 0);
    if (sortA !== sortB) return sortA - sortB;
    return idA - idB;
  });

  // De-duplicate paired cases to discard duplicate cases (e.g. historical duplicates with sort_order = 999999)
  const uniquePaired = [];
  const seenKeys = new Set();
  paired.forEach(item => {
    const key = `${item.c.category}::${item.c.function_category || item.c.functionCategory || ''}::${item.c.function}::${item.c.expected}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniquePaired.push(item);
    }
  });

  const cases = uniquePaired.map(p => p.c);
  const caseResults = uniquePaired.map(p => p.r);
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
  let circleId;
  let leftCircleId;
  try {
    arrowId = workbook.addImage({ filename: path.join(__dirname, '../assets/arrow.png'), extension: 'png' });
    onstarId = workbook.addImage({ filename: path.join(__dirname, '../assets/安吉星.png'), extension: 'png' });
    bgId = workbook.addImage({ filename: path.join(__dirname, '../assets/渐变色底图.png'), extension: 'png' });
    circleId = workbook.addImage({ filename: path.join(__dirname, '../assets/圆.png'), extension: 'png' });
    leftCircleId = workbook.addImage({ filename: path.join(__dirname, '../assets/左侧打孔圆.png'), extension: 'png' });
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

  for (let r = 1; r <= 53; r++) {
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
  
  wsToc.getCell('D10').value = 'Table of Contents';
  wsToc.getCell('D10').font = { size: 20, bold: true, name: '微软雅黑', color: { argb: 'FF000000' } };
  
  for (let c = 4; c <= 8; c++) {
    wsToc.getRow(10).getCell(c).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
  }

  wsToc.getCell('D12').value = 'Contents';
  wsToc.getCell('D12').font = { size: 20, bold: true, name: '微软雅黑', color: { argb: 'FF000000' } };

  const tocLinks = [
    { row: 14, text: '车辆服务', target: "'车辆服务'!A1" },
    { row: 15, text: '手机APP-iOS', target: "'手机APP-iOS'!A1" },
    { row: 16, text: '手机APP-Android', target: "'手机APP-Android'!A1" },
    { row: 17, text: '微信小程序', target: "'微信小程序'!A1" },
    { row: 18, text: 'SGM问题清单', target: "'SGM问题清单'!A1" },
    { row: 19, text: '截图', target: "'截图'!A1" }
  ];

  tocLinks.forEach((link) => {
    const cell = wsToc.getCell(`D${link.row}`);
    cell.value = { text: link.text, hyperlink: `#${link.target}` };
    cell.font = { size: 20, name: '微软雅黑', color: { argb: 'FF0563C1' }, underline: true };
  });

  drawThemeFrame(wsToc, 2, 10, 53, arrowId, onstarId, bgId);

  // --- 车辆服务 Sheet ---
  const wsVehicle = workbook.addWorksheet('车辆服务');
  drawTemplateHeaders(wsVehicle, `${vehicleModel}车辆手机APP验证测试- 车辆服务`, info, false);
  
  // Header Row 15
  const vHeaders = ["No.", "功能大类", "功能", "测试内容", "测试时间\\n测试开始时间         ", "最终结果:\\nPass/Fail", "备注"];
  const vRow15 = wsVehicle.getRow(15);
  vRow15.height = 45.95;
  vHeaders.forEach((h, idx) => {
    const cell = vRow15.getCell(idx + 3);
    cell.value = h.replace(/\\n/g, '\n');
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF69AEF3' } };
    cell.font = { size: 12, color: { argb: 'FFFFFFFF' }, name: '微软雅黑' };
    cell.border = {
      left: { style: 'thin', color: { argb: 'FF87C0F6' } },
      right: { style: 'thin', color: { argb: 'FF87C0F6' } },
      top: { style: 'thin', color: { argb: 'FF87C0F6' } },
      bottom: { style: 'thin', color: { argb: 'FF87C0F6' } }
    };
    let align = { vertical: 'middle', horizontal: 'center', wrapText: true };
    if ([4, 5, 6, 9].includes(idx + 3)) align.horizontal = 'left';
    else if (idx + 3 === 7) align.horizontal = 'right';
    else if (idx + 3 === 8) align.horizontal = 'center';
    cell.alignment = align;
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

  const vEndRow = wsVehicle.rowCount;
  wsVehicle.getRow(vEndRow + 1).height = 30;
  wsVehicle.getRow(vEndRow + 2).height = 30;
  wsVehicle.getRow(vEndRow + 3).height = 30;
  drawThemeFrame(wsVehicle, 2, 10, vEndRow + 3, arrowId, onstarId, bgId, circleId, undefined, 12, 1, 9, 369093);

  // --- 手机APP Sheets ---
  const addAppSheetWithData = (sheetName, titleSuffix, appVersion, caseFilter, options = {}) => {
    const wsApp = workbook.addWorksheet(sheetName);
    const versionLabel = options.versionLabel || '手机版本：';
    const reportTitle = options.reportTitle || `${vehicleModel}车辆手机APP验证测试- ${titleSuffix}`;
    const feedbackLabel = options.feedbackLabel || 'APP反馈时长/秒';
    
    // Copy info and inject specific appVersion
    const sheetInfo = { ...info, appVersion: appVersion || '', versionLabel };
    drawTemplateHeaders(wsApp, reportTitle, sheetInfo, true);
    
    const appColWidths = [
      5.125, 6.625, 10.625, 14.625, 25.375, 32.375, 17.375, 25.625, 17, 25.625, 13, 6.625, 0.625, 4.625, 12.625
    ];
    appColWidths.forEach((w, i) => {
      wsApp.getColumn(i + 1).width = w;
    });

    const aHeaders = ["No.", "功能大类", "功能", "测试内容", "测试开始时间        ", "车辆执行时长/秒", feedbackLabel, "最终结果:\\nPass/Fail", "备注"];
    const aRow15 = wsApp.getRow(15);
    aRow15.height = 45.95;
    aHeaders.forEach((h, idx) => {
      const cell = aRow15.getCell(idx + 3);
      cell.value = h.replace(/\\n/g, '\n');
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF69AEF3' } };
      cell.font = { size: 12, color: { argb: 'FFFFFFFF' }, name: '微软雅黑' };
      cell.border = {
        left: { style: 'thin', color: { argb: 'FF87C0F6' } },
        right: { style: 'thin', color: { argb: 'FF87C0F6' } },
        top: { style: 'thin', color: { argb: 'FF87C0F6' } },
        bottom: { style: 'thin', color: { argb: 'FF87C0F6' } }
      };
      let align = { vertical: 'middle', horizontal: 'center', wrapText: true };
      if ([4, 5, 6].includes(idx + 3)) align.horizontal = 'left';
      else if (idx + 3 === 7) align.horizontal = 'right';
      cell.alignment = align;
    });

    const appRows = cases
      .map((c, i) => ({ c, r: caseResults[i] || {} }))
      .filter(({ c }) => caseFilter(c));
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

    const aEndRow = wsApp.rowCount;
    wsApp.getRow(aEndRow + 1).height = 30;
    wsApp.getRow(aEndRow + 2).height = 30;
    wsApp.getRow(aEndRow + 3).height = 30;
    drawThemeFrame(wsApp, 2, 12, aEndRow + 3, arrowId, onstarId, bgId, circleId, leftCircleId, 14, 1, 11, 364113, 9, 1642260, 11);


  };

  addAppSheetWithData(
    '手机APP-iOS',
    '手机APP-iOS',
    vehicle.iosVersion || vehicle.ios_version || '',
    c => c.category === '手机应用' && (c.function_category || c.functionCategory) === '手机APP-iOS'
  );
  addAppSheetWithData(
    '手机APP-Android',
    '手机APP-Android',
    vehicle.androidVersion || vehicle.android_version || '',
    c => c.category === '手机应用' && (c.function_category || c.functionCategory) === '手机APP-Android'
  );
  addAppSheetWithData(
    '微信小程序',
    '微信小程序',
    vehicle.wechatVersion || vehicle.wechat_version || '',
    c => c.category === '小程序' || c.category === '微信小程序',
    {
      versionLabel: '小程序版本：',
      reportTitle: `${vehicleModel}车辆微信小程序验证测试`,
      feedbackLabel: '小程序反馈时长/秒'
    }
  );

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
    { key: 'id', title: 'ID', width: 4.875, color: 'FFDDEBF7' },
    { key: 'model', title: '车型\\nmotorcycle type', width: 6.5, color: 'FFDDEBF7' },
    { key: 'phase', title: '生产阶段\\nBuild Phase', width: 6, color: 'FFDDEBF7' },
    { key: 'source', title: '问题来源\\nSource', width: 6, color: 'FFDDEBF7' },
    { key: 'loc', title: '试验地点\\nTest Place', width: 8.375, color: 'FFDDEBF7' },
    { key: 'vin', title: 'VIN', width: 23.25, color: 'FFDDEBF7' },
    { key: 'mil', title: '里程数\\nOdo.', width: 9.125, color: 'FFDDEBF7' },
    { key: 'finder', title: '发现人\\nFinder', width: 8.875, color: 'FFDDEBF7' },
    { key: 'approve', title: '问题审批\\nApprove', width: 8.875, color: 'FFDDEBF7' },
    { key: 'date', title: '问题提出日期\\nIssue Identify Date', width: 8.875, color: 'FFDDEBF7' },
    { key: 'time', title: '问题提出时间\\nIssue Identify Time', width: 8.875, color: 'FFDDEBF7' },
    { key: 'smt', title: 'SMT', width: 8.875, color: 'FFDDEBF7', parent: '问题描述\\nVerbatim(Issue Explained)' },
    { key: 'desc', title: '详细描述', width: 34.5, color: 'FFDDEBF7', parent: '问题描述\\nVerbatim(Issue Explained)' },
    { key: 'defect', title: '缺陷模式', width: 8.875, color: 'FFDDEBF7', parent: '问题描述\\nVerbatim(Issue Explained)' },
    { key: 'note', title: '备注', width: 12.375, color: 'FFDDEBF7' },
    { key: 'rate', title: '问题严重性\\nRate', width: 8.875, color: 'FFDDEBF7' },
    { key: 'pic', title: '详图\\nPicture', width: 8.875, color: 'FFDDEBF7' },
    { key: 'freq', title: '频次\\nFrequence', width: 8.875, color: 'FFDDEBF7' },
    { key: 'dept', title: '责任部门', width: 8.875, color: 'FFFFC000' },
    { key: 'pqe', title: 'PQE', width: 8.875, color: 'FFFFC000' },
    { key: 'sup', title: '供应商\\nSupplier', width: 8.875, color: 'FFFFC000' },
    { key: 'status', title: '调查状态\\nAnalysis Process', width: 8.875, color: 'FFFFC000' }
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
      phase: vehicle.productionStage || vehicle.production_stage || '',
      source: '',
      loc: vehicle.address || '',
      vin: vin,
      mil: mileage ? `${mileage}KM` : '',
      finder: tester,
      approve: '',
      date: `${d.getMonth() + 1}月${d.getDate()}日`,
      time: d.toTimeString().slice(0, 5),
      smt: '',
      desc: bug.description ? bug.description.split(' | ACTIVE_CASE: ')[0] : '',
      defect: '',
      note: '',
      rate: '',
      pic: (bug.media && bug.media.length > 0) ? '见截图页' : '',
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
  wsScreenshots.getColumn(1).width = 40;
  wsScreenshots.getColumn(2).width = 80;

  let currentRow = 1;

  // 辅助压缩函数
  const processImage = async (sourceData, desc) => {
    wsScreenshots.getCell(`A${currentRow}`).value = desc;
    wsScreenshots.getCell(`A${currentRow}`).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    wsScreenshots.getCell(`A${currentRow}`).font = { name: '微软雅黑', size: 10, bold: true };

    let width = 500;
    let height = 350;
    let buffer;

    try {
      if (sharp) {
        const img = sharp(sourceData);
        const metadata = await img.metadata();
        width = metadata.width || 500;
        height = metadata.height || 350;
        if (width > 600 || height > 600) {
          const ratio = Math.min(600 / width, 600 / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        buffer = await img.resize(width, height).jpeg({ quality: 70 }).toBuffer();
      } else {
        buffer = Buffer.isBuffer(sourceData) ? sourceData : fs.readFileSync(sourceData);
      }
      
      const imageId = workbook.addImage({ buffer, extension: 'jpeg' });
      wsScreenshots.addImage(imageId, {
        tl: { col: 1, row: currentRow - 1 },
        ext: { width, height },
        editAs: 'oneCell'
      });
      // exceljs 行高单位为磅，大约等于 px * 0.75
      wsScreenshots.getRow(currentRow).height = Math.max(80, height * 0.75 + 10);
    } catch (err) {
      console.error('[export] 图片处理失败:', err);
      wsScreenshots.getCell(`B${currentRow}`).value = '图片加载失败';
      wsScreenshots.getRow(currentRow).height = 80;
    }
    currentRow++;
  };

  const getSourceData = (mUrl) => {
    if (!mUrl) return null;
    if (mUrl.startsWith('data:image/')) {
      const base64Data = mUrl.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    }
    const filename = mUrl.split('/').pop();
    const localPath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(localPath)) return localPath;
    return null;
  };

  // 1. 处理现场环境照片 (优先放在第一行)
  let envPhotos = vehicle.envPhotos || vehicle.env_photo;
  if (typeof envPhotos === 'string') {
    try {
      envPhotos = JSON.parse(envPhotos);
    } catch (e) {
      envPhotos = [];
    }
  }
  if (!Array.isArray(envPhotos)) envPhotos = [];

  for (let mIdx = 0; mIdx < envPhotos.length; mIdx++) {
    const m = envPhotos[mIdx];
    const url = typeof m === 'string' ? m : (m.url || '');
    const sourceData = getSourceData(url);
    if (!sourceData) continue;

    const desc = `【现场环境照片】\n(截图 ${mIdx + 1}/${envPhotos.length})`;
    await processImage(sourceData, desc);
  }

  // 2. 处理测试案例截图
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    const media = (caseResults[i] || {}).media || [];
    for (let mIdx = 0; mIdx < media.length; mIdx++) {
      const m = media[mIdx];
      const sourceData = getSourceData(m.url);
      if (!sourceData) continue;

      const desc = `【测试用例】\n大类: ${c.category}\n功能: ${c.function}\n描述: ${c.content || c.expected || ''}\n(截图 ${mIdx + 1}/${media.length})`;
      await processImage(sourceData, desc);
    }
  }

  // 2. 处理缺陷截图
  for (let i = 0; i < bugs.length; i++) {
    const b = bugs[i];
    const media = b.media || [];
    for (let mIdx = 0; mIdx < media.length; mIdx++) {
      const m = media[mIdx];
      const sourceData = getSourceData(m.url);
      if (!sourceData) continue;

      const desc = `【缺陷记录】\n标题: ${b.issue}\n步骤: ${b.steps || ''}\n(截图 ${mIdx + 1}/${media.length})`;
      await processImage(sourceData, desc);
    }
  }



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
