#!/usr/bin/env node
/**
 * Test Enrichment V4.1 sur un échantillon de jobs
 * Version JavaScript (utilise les fichiers compilés)
 */

const admin = require('firebase-admin');
const { 
    extractWorkLocation, 
    extractEmploymentType,
    extractExperienceLevel
} = require('../functions/lib/utils/jobEnrichment');

// Initialize Firebase Admin
const serviceAccount = require('../jobzai-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testEnrichmentOnSample(sampleSize = 20) {
    console.log('\n🧪 Test Enrichment V4.1 sur échantillon\n');
    console.log('='.repeat(70));
    
    try {
        // Récupérer un échantillon de jobs
        console.log(`\n📥 Récupération de ${sampleSize} jobs aléatoires...`);
        
        const snapshot = await db.collection('jobs')
            .orderBy('postedAt', 'desc')
            .limit(sampleSize * 3) // On prend plus pour avoir de la variété
            .get();
        
        if (snapshot.empty) {
            console.log('❌ Aucun job trouvé dans la base');
            return;
        }
        
        // Mélanger et prendre sampleSize jobs
        const allJobs = snapshot.docs;
        const shuffled = allJobs.sort(() => 0.5 - Math.random());
        const selectedJobs = shuffled.slice(0, sampleSize);
        
        console.log(`✅ ${selectedJobs.length} jobs sélectionnés\n`);
        
        const comparisons = [];
        let remoteChangedCount = 0;
        let contractChangedCount = 0;
        let remoteRemovedCount = 0;
        let contractRemovedCount = 0;
        let remoteAddedCount = 0;
        let contractAddedCount = 0;
        
        // Analyser chaque job
        for (let i = 0; i < selectedJobs.length; i++) {
            const doc = selectedJobs[i];
            const jobData = doc.data();
            
            console.log(`\n[${i + 1}/${selectedJobs.length}] 🔍 Analyse: ${jobData.title}`);
            console.log('-'.repeat(70));
            console.log(`📍 Company: ${jobData.company || 'N/A'}`);
            console.log(`📝 Description: ${(jobData.description || '').substring(0, 100)}...`);
            
            // Valeurs actuelles
            const oldWorkLocations = jobData.workLocations || [];
            const oldEmploymentTypes = jobData.employmentTypes || [];
            const oldVersion = jobData.enrichedVersion || 'unknown';
            
            console.log(`📊 Version actuelle: ${oldVersion}`);
            console.log(`🌍 Work Locations (old): ${oldWorkLocations.join(', ') || 'none'}`);
            console.log(`💼 Employment Types (old): ${oldEmploymentTypes.join(', ') || 'none'}`);
            
            // Créer JobDoc pour re-enrichissement
            const tempJob = {
                id: doc.id,
                title: jobData.title,
                description: jobData.description,
                summary: jobData.summary,
                location: jobData.location,
                company: jobData.company,
                remote: jobData.remote,
                remotePolicy: jobData.remotePolicy,
            };
            
            // Appliquer V4.1
            const experienceLevels = extractExperienceLevel(tempJob);
            const newEmploymentTypes = extractEmploymentType(tempJob, experienceLevels);
            const newWorkLocations = extractWorkLocation(tempJob);
            
            console.log(`🆕 Work Locations (V4.1): ${newWorkLocations.join(', ')}`);
            console.log(`🆕 Employment Types (V4.1): ${newEmploymentTypes.join(', ')}`);
            
            // Détection des changements
            const changeDetails = [];
            let changed = false;
            
            // Changements Work Location
            const oldRemote = oldWorkLocations.includes('remote');
            const newRemote = newWorkLocations.includes('remote');
            
            if (oldRemote !== newRemote) {
                changed = true;
                if (oldRemote && !newRemote) {
                    changeDetails.push('❌ REMOTE SUPPRIMÉ (probablement faux positif)');
                    remoteRemovedCount++;
                } else {
                    changeDetails.push('✅ REMOTE AJOUTÉ');
                    remoteAddedCount++;
                }
                remoteChangedCount++;
            }
            
            // Changements Employment Type
            const oldContract = oldEmploymentTypes.includes('contract');
            const newContract = newEmploymentTypes.includes('contract');
            
            if (oldContract !== newContract) {
                changed = true;
                if (oldContract && !newContract) {
                    changeDetails.push('❌ CONTRACT SUPPRIMÉ (probablement faux positif)');
                    contractRemovedCount++;
                } else {
                    changeDetails.push('✅ CONTRACT AJOUTÉ');
                    contractAddedCount++;
                }
                contractChangedCount++;
            }
            
            // Afficher les changements
            if (changed) {
                console.log(`\n⚠️  CHANGEMENTS DÉTECTÉS:`);
                changeDetails.forEach(detail => console.log(`   ${detail}`));
            } else {
                console.log(`\n✅ Aucun changement significatif`);
            }
            
            comparisons.push({
                jobId: doc.id,
                title: jobData.title,
                company: jobData.company,
                oldVersion,
                oldWorkLocations,
                newWorkLocations,
                oldEmploymentTypes,
                newEmploymentTypes,
                changed,
                changeDetails
            });
        }
        
        // Résumé des résultats
        console.log('\n' + '='.repeat(70));
        console.log('\n📊 RÉSUMÉ DES RÉSULTATS\n');
        
        const changedJobs = comparisons.filter(c => c.changed);
        console.log(`Total jobs analysés: ${comparisons.length}`);
        console.log(`Jobs avec changements: ${changedJobs.length} (${Math.round(changedJobs.length / comparisons.length * 100)}%)`);
        console.log(`Jobs sans changements: ${comparisons.length - changedJobs.length}`);
        
        console.log('\n🌍 Changements Work Location:');
        console.log(`   - Total changements: ${remoteChangedCount}`);
        console.log(`   - Remote supprimé (faux positifs corrigés): ${remoteRemovedCount}`);
        console.log(`   - Remote ajouté: ${remoteAddedCount}`);
        
        console.log('\n💼 Changements Employment Type:');
        console.log(`   - Total changements: ${contractChangedCount}`);
        console.log(`   - Contract supprimé (faux positifs corrigés): ${contractRemovedCount}`);
        console.log(`   - Contract ajouté: ${contractAddedCount}`);
        
        // Jobs avec changements significatifs
        if (changedJobs.length > 0) {
            console.log('\n\n🔍 DÉTAILS DES JOBS MODIFIÉS:\n');
            changedJobs.forEach((job, idx) => {
                console.log(`${idx + 1}. ${job.title} (${job.company})`);
                job.changeDetails.forEach(detail => console.log(`   ${detail}`));
                console.log(`   Avant: remote=${job.oldWorkLocations.includes('remote')}, contract=${job.oldEmploymentTypes.includes('contract')}`);
                console.log(`   Après: remote=${job.newWorkLocations.includes('remote')}, contract=${job.newEmploymentTypes.includes('contract')}`);
                console.log('');
            });
        }
        
        // Recommandation
        console.log('\n' + '='.repeat(70));
        console.log('\n💡 RECOMMANDATION:\n');
        
        const falsePositiveRate = (remoteRemovedCount + contractRemovedCount) / (comparisons.length * 2) * 100;
        
        if (falsePositiveRate > 15) {
            console.log(`⚠️  Taux de faux positifs élevé (${falsePositiveRate.toFixed(1)}%)`);
            console.log('   V4.1 corrige beaucoup d\'erreurs de classification.');
            console.log('   ✅ RECOMMANDÉ: Re-enrichir tous les jobs existants');
        } else if (falsePositiveRate > 5) {
            console.log(`📊 Taux de faux positifs modéré (${falsePositiveRate.toFixed(1)}%)`);
            console.log('   V4.1 apporte des améliorations notables.');
            console.log('   ✅ RECOMMANDÉ: Re-enrichir les jobs récents (< 30 jours)');
        } else {
            console.log(`✅ Taux de faux positifs faible (${falsePositiveRate.toFixed(1)}%)`);
            console.log('   Les changements sont minimes.');
            console.log('   ⏸️  OPTIONNEL: Laisser les nouveaux jobs utiliser V4.1 progressivement');
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('\n✅ Test terminé!\n');
        
    } catch (error) {
        console.error('\n❌ Erreur:', error);
        throw error;
    } finally {
        // Clean up
        await admin.app().delete();
    }
}

// Run the test
const sampleSize = parseInt(process.argv[2]) || 20;
testEnrichmentOnSample(sampleSize)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });


