require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
  });

  const [cases] = await db.query("SELECT * FROM cases");
  const [orders] = await db.query("SELECT * FROM tester_case_orders WHERE tester_name = '施雯'");
  
  if (orders.length > 0) {
    const caseIds = JSON.parse(orders[0].case_ids);
    console.log('Total order length:', caseIds.length);
    
    // Separate iOS and Android cases
    const iosCases = cases.filter(c => c.function_category === '手机APP-iOS');
    const androidCases = cases.filter(c => c.function_category === '手机APP-Android');
    
    console.log(`Found ${iosCases.length} iOS cases and ${androidCases.length} Android cases.`);

    // Extract iOS and Android IDs
    const iosIds = iosCases.map(c => String(c.id));
    const androidIds = androidCases.map(c => String(c.id));

    // Find the relative order of iOS cases in the user's order
    const orderedIosIds = caseIds.filter(id => iosIds.includes(String(id)));
    console.log(`Out of the ordered array, ${orderedIosIds.length} are iOS cases.`);

    // Map iOS ordered IDs to Android IDs
    const targetAndroidOrder = [];
    const mappedAndroidIds = new Set();

    let mappedCount = 0;
    for (const iosId of orderedIosIds) {
      const iosCase = iosCases.find(c => String(c.id) === String(iosId));
      if (iosCase) {
        const androidCase = androidCases.find(a => 
          a.function === iosCase.function && 
          a.expected === iosCase.expected
        );
        if (androidCase) {
          mappedCount++;
          targetAndroidOrder.push(String(androidCase.id));
          mappedAndroidIds.add(String(androidCase.id));
        } else {
           console.log(`Could not find Android equivalent for iOS case ${iosCase.id} - ${iosCase.function}`);
        }
      }
    }
    console.log(`Successfully mapped ${mappedCount} cases from iOS to Android.`);

    // Append any Android cases that were not mapped (just to be safe, keep them at the end)
    for (const a of androidCases) {
      if (!mappedAndroidIds.has(String(a.id))) {
        targetAndroidOrder.push(String(a.id));
      }
    }

    // Now, find all positions in the original caseIds where Android IDs are located
    const androidPositions = [];
    caseIds.forEach((id, index) => {
      if (androidIds.includes(String(id))) {
        androidPositions.push(index);
      }
    });

    console.log(`Found ${androidPositions.length} Android cases currently in the user's order.`);

    if (androidPositions.length !== targetAndroidOrder.length) {
       console.log(`Mismatch in lengths: ${androidPositions.length} positions vs ${targetAndroidOrder.length} target IDs.`);
       // We'll just replace the ones we have positions for, and push the rest to the end
    }

    // Create the new case order
    const newCaseIds = [...caseIds];
    
    // First, remove all Android IDs from the array
    const filteredCaseIds = newCaseIds.filter(id => !androidIds.includes(String(id)));

    // Now, find where iOS cases are, and insert Android cases immediately after them?
    // The user's request: "按照ios的同样更新下". 
    // It's probably better to keep the Android cases where they originally were as a block, or just put them exactly in the positions they occupied.
    
    // Let's replace the original positions
    androidPositions.forEach((pos, idx) => {
        if (idx < targetAndroidOrder.length) {
            newCaseIds[pos] = targetAndroidOrder[idx];
        }
    });

    // If there are leftover targetAndroidOrder, we shouldn't have any if the length matches, but if target is larger, we'd need to append.
    // Wait, the safest approach is to replace at original android positions.
    const leftoverAndroidIds = targetAndroidOrder.slice(androidPositions.length);
    if (leftoverAndroidIds.length > 0) {
        newCaseIds.push(...leftoverAndroidIds);
    }

    // Let's just double check
    console.log('New Android order length to inject:', targetAndroidOrder.length);
    
    // Update the database!
    await db.query(
      "UPDATE tester_case_orders SET case_ids = ?, updated_at = NOW() WHERE tester_name = '施雯'",
      [JSON.stringify(newCaseIds)]
    );
    console.log('Successfully updated order for 施雯!');
  }

  await db.end();
}

run().catch(console.error);
