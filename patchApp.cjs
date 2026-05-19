const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  "import html2canvas from 'html2canvas';",
  "import html2canvas from 'html2canvas';\nimport { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc, getDoc, getDocs } from 'firebase/firestore';\nimport { db } from './firebase';"
);

// 2. Remove fetchData effect and replace with onSnapshot
const fetchDataOld = `  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      const endpoint = \`\${API_URL}/api/initial-data\`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      const data = await response.json();
      setQueues(data.queues || []);
      setSchools(data.schools || []);
      setOperators(data.operators || []);
      setConfig(data.config);
      // Initialize edit fields when data arrives
      setEditTitle(prev => prev || data.config.appTitle);
      setEditSubtitle(prev => prev || data.config.appSubtitle);
      setEditRunningText(prev => prev || data.config.runningText || '');
      setEditStartTime(prev => prev || data.config.serviceStartTime);
      setEditEndTime(prev => prev || data.config.serviceEndTime);
      setEditTicketTemplate(prev => prev || data.config.ticketTemplate || 'receipt');
      setIsInitialLoading(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
         console.warn("Retrying fetch...");
      }
    }
  };

  // Poll for data every 3 seconds for simple "real-time" sync
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);`;

const fetchDataNew = `  // --- Data Fetching (Firebase) ---
  useEffect(() => {
    const unsubQueues = onSnapshot(collection(db, 'queues'), (snapshot) => {
      const q = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueItem));
      // Sort by timestamp
      q.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setQueues(q);
    });

    const unsubSchools = onSnapshot(collection(db, 'schools'), (snapshot) => {
      setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School)));
    });

    const unsubOperators = onSnapshot(collection(db, 'operators'), (snapshot) => {
      setOperators(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Operator)));
    });

    const unsubConfig = onSnapshot(doc(db, 'config', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        const c = snapshot.data() as AppConfig;
        setConfig(c);
        setEditTitle(c.appTitle);
        setEditSubtitle(c.appSubtitle);
        setEditRunningText(c.runningText || '');
        setEditStartTime(c.serviceStartTime);
        setEditEndTime(c.serviceEndTime);
        setEditTicketTemplate(c.ticketTemplate || 'receipt');
      }
      setIsInitialLoading(false);
    });

    return () => {
      unsubQueues();
      unsubSchools();
      unsubOperators();
      unsubConfig();
    };
  }, []);

  const fetchData = () => {}; // Stub for backward compatibility with legacy calls
`;

content = content.replace(fetchDataOld, fetchDataNew);

// 3. handleAmbilAntrean
content = content.replace(
  `      const response = await fetch(\`\${API_URL}/api/queues\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: formattedNumber,
          nama: formData.nama,
          nisn: formData.nisn,
          asalSekolah: formData.asalSekolah,
          noHp: formData.noHp
        }),
      });

      if (response.ok) {
        const newQueue = await response.json();
        setLastCreatedQueue(newQueue);
        // Auto-add school if not exists
        if (!schools.some(s => s.nama === formData.asalSekolah)) {
          await fetch(\`\${API_URL}/api/schools\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: formData.asalSekolah }),
          });
        }
        
        fetchData();
        setFormData({ nama: '', nisn: '', asalSekolah: '', noHp: '' });
        setIsManualSchool(false);
        const waktuDaftar = new Date(newQueue.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        setModal({
          isOpen: true,
          title: 'BERHASIL!',
          message: \`NOMOR ANTREAN: \${formattedNumber}\\nNAMA: \${newQueue.nama}\\nWAKTU DAFTAR: \${waktuDaftar}\`,
          type: 'info'
        });
      }`,
  `
      const queueData = {
        number: formattedNumber,
        nama: formData.nama,
        nisn: formData.nisn,
        asalSekolah: formData.asalSekolah,
        noHp: formData.noHp,
        timestamp: new Date().toISOString(),
        status: 'waiting'
      };
      const docRef = await addDoc(collection(db, 'queues'), queueData);
      const newQueue = { id: docRef.id, ...queueData } as QueueItem;
      
      setLastCreatedQueue(newQueue);
      
      if (!schools.some(s => s.nama === formData.asalSekolah)) {
        await addDoc(collection(db, 'schools'), { nama: formData.asalSekolah });
      }

      setFormData({ nama: '', nisn: '', asalSekolah: '', noHp: '' });
      setIsManualSchool(false);
      const waktuDaftar = new Date(newQueue.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      setModal({
        isOpen: true,
        title: 'BERHASIL!',
        message: \`NOMOR ANTREAN: \${formattedNumber}\\nNAMA: \${newQueue.nama}\\nWAKTU DAFTAR: \${waktuDaftar}\`,
        type: 'info'
      });
`
);

// 4. handlePanggilBerikutnya
content = content.replace(
  `        // Update config
        await fetch(\`\${API_URL}/api/config\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ servingIndex: nextIndex }),
        });
        
        // Update next queue status
        await fetch(\`\${API_URL}/api/queues/\${nextQueue.id}\`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'serving' }),
        });
        
        // Mark previous as completed
        if (config.servingIndex >= 0) {
          await fetch(\`\${API_URL}/api/queues/\${queues[config.servingIndex].id}\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' }),
          });
        }
        
        fetchData();`,
  `        await setDoc(doc(db, 'config', 'main'), { servingIndex: nextIndex }, { merge: true });
        await updateDoc(doc(db, 'queues', nextQueue.id), { status: 'serving' });
        if (config.servingIndex >= 0 && queues[config.servingIndex]) {
          await updateDoc(doc(db, 'queues', queues[config.servingIndex].id), { status: 'completed' });
        }`
);

// 5. handlePanggilManual
content = content.replace(
  `      await fetch(\`\${API_URL}/api/config\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servingIndex: newIndex }),
      });
      
      await fetch(\`\${API_URL}/api/queues/\${targetQueue.id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'serving' }),
      });
      
      fetchData();`,
  `      await setDoc(doc(db, 'config', 'main'), { servingIndex: newIndex }, { merge: true });
      await updateDoc(doc(db, 'queues', targetQueue.id), { status: 'serving' });`
);

// 6. handleReset
content = content.replace(
  `      onConfirm: async () => {
        await fetch(\`\${API_URL}/api/reset\`, { method: 'POST' });
        fetchData();
      }`,
  `      onConfirm: async () => {
        const snap = await getDocs(collection(db, 'queues'));
        const promises = snap.docs.map(d => deleteDoc(doc(db, 'queues', d.id)));
        await Promise.all(promises);
        await setDoc(doc(db, 'config', 'main'), { servingIndex: -1 }, { merge: true });
      }`
);

// 7. handleUpdateQueueStatus
content = content.replace(
  `      await fetch(\`\${API_URL}/api/queues/\${id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();`,
  `      await updateDoc(doc(db, 'queues', id), { status });`
);

// 8. handleDeleteItem
content = content.replace(
  `      await fetch(\`\${API_URL}/api/queues/\${id}\`, { method: 'DELETE' });
      fetchData();`,
  `      await deleteDoc(doc(db, 'queues', id));`
);

// 9. updateConfig
content = content.replace(
  `    try {
      await fetch(\`\${API_URL}/api/config\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }`,
  `    try {
      await setDoc(doc(db, 'config', 'main'), updates, { merge: true });
    } catch (error) {
      console.error(error);
    }`
);

// 10. handleAddOperator
content = content.replace(
  `      const url = isEditing 
        ? \`\${API_URL}/api/operators/\${editingOperatorId}\`
        : \`\${API_URL}/api/operators\`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opFormData),
      });
      if (response.ok) {
        fetchData();
        setOpFormData({ username: '', password: '', displayName: '', tableNumber: '' });
        setEditingOperatorId(null);
        setModal({ isOpen: true, title: 'Berhasil', message: isEditing ? 'Operator berhasil diperbarui.' : 'Operator baru telah ditambahkan.', type: 'info' });
      }`,
  `      if (isEditing && editingOperatorId) {
        await updateDoc(doc(db, 'operators', editingOperatorId), opFormData);
      } else {
        await addDoc(collection(db, 'operators'), opFormData);
      }
      setOpFormData({ username: '', password: '', displayName: '', tableNumber: '' });
      setEditingOperatorId(null);
      setModal({ isOpen: true, title: 'Berhasil', message: isEditing ? 'Operator berhasil diperbarui.' : 'Operator baru telah ditambahkan.', type: 'info' });`
);

// 11. handleDeleteOperator
content = content.replace(
  `        try {
          await fetch(\`\${API_URL}/api/operators/\${id}\`, { method: 'DELETE' });
          fetchData();
        } catch (err) {
          console.error(err);
        }`,
  `        try {
          await deleteDoc(doc(db, 'operators', id));
        } catch (err) {
          console.error(err);
        }`
);


fs.writeFileSync('src/App.tsx', content);
console.log('Done rewriting App.tsx');
