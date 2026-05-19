import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const newSchools = [
  "UPT SMP NEGERI 7 PASURUAN",
  "UPT SMP NEGERI 10 PASURUAN",
  "UPT SMP NEGERI 11 PASURUAN",
  "SMP S-PEAM",
  "UPT SMP NEGERI 4 Pasuruan",
  "UPT SMP NEGERI 6 PASURUAN",
  "UPT SMP NEGERI 8 PASURUAN",
  "UPT SMP NEGERI 9 PASURUAN",
  "SMP ISLAM ROUDHOTUL HASANAH",
  "SMP K SANG TIMUR",
  "SMP KRISTEN ELKANA",
  "SMP BAYT AL HIKMAH",
  "SMP MAARIF I",
  "UPT SMP NEGERI 5 PASURUAN",
  "UPT SMP NEGERI 1 PASURUAN",
  "UPT SMP NEGERI 2 PASURUAN",
  "UPT SMP NEGERI 3 PASURUAN",
  "SMP 1949",
  "SMP A. WAHID HASYIM",
  "SMP BAHTERA INDONESIA",
  "SMP ISLAM PASURUAN",
  "SMP ISLAM TARBIYATUS SALAFIYAH",
  "SMP MUHAMMADIYAH I",
  "SMP SABILUTH THOYYIB",
  "SMP TRIBAHASA HARAPAN BANGSA",
  "SMPP AL AZHAR",
  "SMPS DARUL ULUM",
  "SMPS ISLAM DARUL KAROMAH"
];

async function seed() {
  console.log('Fetching existing schools...');
  const existingDocs = await getDocs(collection(db, 'schools'));
  const existingNames = existingDocs.docs.map(doc => doc.data().nama);

  console.log('Adding new schools...');
  for (const name of newSchools) {
    if (!existingNames.includes(name)) {
      await addDoc(collection(db, 'schools'), { nama: name });
      console.log(`Added: ${name}`);
    } else {
      console.log(`Skipped (already exists): ${name}`);
    }
  }
  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch(console.error);
