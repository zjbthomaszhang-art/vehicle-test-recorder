/**
 * Dynamically generates hierarchical case numbers (e.g., 1.1.1.1) based on the sorted order of cases.
 * The cases array MUST be pre-sorted (e.g., by sort_order) before passing to this function.
 * 
 * @param {Array} cases - Array of case objects
 * @returns {Array} - Array of case objects with an added `case_number` property
 */
export function assignHierarchicalNumbers(cases) {
    if (!cases || cases.length === 0) return [];

    // The cases array is already sorted by sort_order.
    // We will build a tree to remember the assigned number for each node.
    const tree = {
        counter: 0,
        children: {}
    };

    return cases.map(c => {
        const cat = c.category || '';
        const fCat = c.function_category || c.functionCategory || '';
        const func = c.function || '';

        // Category
        if (!tree.children[cat]) {
            tree.counter++;
            tree.children[cat] = { number: tree.counter, counter: 0, children: {} };
        }
        const catNode = tree.children[cat];

        // Function Category
        if (!catNode.children[fCat]) {
            catNode.counter++;
            catNode.children[fCat] = { number: catNode.counter, counter: 0, children: {} };
        }
        const fCatNode = catNode.children[fCat];

        // Function
        if (!fCatNode.children[func]) {
            fCatNode.counter++;
            fCatNode.children[func] = { number: fCatNode.counter, counter: 0, children: {} };
        }
        const funcNode = fCatNode.children[func];

        // Case Content
        funcNode.counter++;
        const caseNumber = `${catNode.number}.${fCatNode.number}.${funcNode.number}.${funcNode.counter}`;

        return {
            ...c,
            case_number: caseNumber
        };
    });
}
