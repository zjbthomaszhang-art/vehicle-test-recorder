

async function testSubmit() {
    const sessionData = {
        vehicle: {
            vehicleModel: 'TESTMODEL',
            model_year: '25',
            vin: '12345678901234567',
            address: 'Test Addr',
            architecture: 'Test Arch',
            iviModule: 'Test IVI',
            commModule: 'Test Comm',
            tester: 'Tom',
            mileage: '1234'
        },
        results: [
            { case_id: 1, result: 'Pass', notes: 'Test Note' }
        ]
    };

    try {
        const res = await fetch('http://localhost:3001/api/test-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}

testSubmit();
