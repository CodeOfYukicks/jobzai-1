/**
 * Check if tasks were created and their status
 */
const admin = require('firebase-admin');

admin.initializeApp({
    projectId: 'jobzai'
});

const db = admin.firestore();

async function checkTasks() {
    console.log('🔍 Checking jobFetchTasks collection...\n');
    
    const tasksSnapshot = await db.collection('jobFetchTasks')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
    
    console.log(`📊 Found ${tasksSnapshot.size} recent tasks\n`);
    
    if (tasksSnapshot.empty) {
        console.log('❌ No tasks found in jobFetchTasks collection!');
        console.log('   The trigger might not be working.\n');
        return;
    }
    
    tasksSnapshot.docs.forEach((doc, idx) => {
        const data = doc.data();
        console.log(`${idx + 1}. Task: ${data.provider}/${data.company}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Created: ${data.createdAt?.toDate()}`);
        if (data.completedAt) console.log(`   Completed: ${data.completedAt.toDate()}`);
        if (data.error) console.log(`   Error: ${data.error}`);
        console.log('');
    });
}

checkTasks().then(() => process.exit(0)).catch(e => {
    console.error('Error:', e);
    process.exit(1);
});

