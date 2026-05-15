/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Ticket, 
  Mic, 
  Users, 
  Monitor, 
  ChevronRight, 
  RotateCcw, 
  Printer, 
  Volume2, 
  Lock, 
  LogOut, 
  User, 
  Building, 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  Settings,
  AlertCircle,
  Download,
  Upload,
  Table as TableIcon,
  FileText,
  FileSpreadsheet,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  GraduationCap,
  BookOpen,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

// --- Configuration ---
const API_URL = ''; // Same origin

interface QueueItem {
  id: string;
  number: string;
  nama: string;
  asalSekolah: string;
  noHp: string;
  status: 'waiting' | 'serving' | 'completed';
  participantStatus?: 'Terdaftar' | 'Diterima' | 'Ditolak';
  timestamp: string;
}

interface AppConfig {
  appTitle: string;
  appSubtitle: string;
  servingIndex: number;
  logoUrl?: string;
  barcodeUrl?: string;
}

interface School {
  id: string;
  nama: string;
}

// --- Components ---

const StudentAnimation = ({ className = "" }: { className?: string }) => (
  <motion.div 
    initial={{ y: 0 }}
    animate={{ y: [0, -10, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    className={`relative flex items-center justify-center ${className}`}
  >
    {/* Simple Student Character using Icons */}
    <div className="relative">
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <User className="h-16 w-16 text-blue-600" strokeWidth={1.5} />
      </motion.div>
      <div className="absolute -top-2 -right-1 bg-white rounded-full p-1 shadow-sm border border-blue-100">
        <GraduationCap className="h-6 w-6 text-blue-500" />
      </div>
      <div className="absolute -bottom-1 -left-2 bg-blue-100 rounded-lg p-1.5 shadow-sm border border-blue-200">
        <BookOpen className="h-5 w-5 text-blue-700" />
      </div>
      
      {/* Decorative floating dots */}
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -top-4 -left-2 w-2 h-2 bg-yellow-400 rounded-full"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        className="absolute top-2 -right-4 w-3 h-3 bg-blue-300 rounded-full"
      />
    </div>
  </motion.div>
);

export default function App() {
  // Auth State (Simplified)
  const [isAdmin, setIsAdmin] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);

  // App State
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    appTitle: 'Antrean PPDB',
    appSubtitle: 'Loket Layanan Pendaftaran',
    servingIndex: -1,
    logoUrl: '',
    barcodeUrl: ''
  });
  
  const [activeTab, setActiveTab] = useState<'kiosk' | 'admin' | 'database'>('kiosk');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isManualSchool, setIsManualSchool] = useState(false);

  // local settings state for editing
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Forms & Modals
  const [formData, setFormData] = useState({ nama: '', asalSekolah: '', noHp: '' });
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  // Database Tab States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'waiting' | 'serving' | 'completed'>('all');
  const [selectedQueue, setSelectedQueue] = useState<QueueItem | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/initial-data`);
      const data = await response.json();
      setQueues(data.queues);
      setSchools(data.schools);
      setConfig(data.config);
      // Initialize edit fields when data arrives
      setEditTitle(prev => prev || data.config.appTitle);
      setEditSubtitle(prev => prev || data.config.appSubtitle);
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
    }
  };

  // Poll for data every 3 seconds for simple "real-time" sync
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- Simplified Auth Handlers ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    
    // Simulate a simple login check
    // We use a fixed password for simplicity as requested by user
    setTimeout(() => {
      if (authEmail === 'admin' && authPassword === 'adminSPMB') {
        setIsAdmin(true);
        setAuthEmail('');
        setAuthPassword('');
      } else {
        setModal({
          isOpen: true,
          title: 'Gagal Masuk',
          message: 'Akses Ditolak',
          type: 'error'
        });
      }
      setAuthLoading(false);
    }, 500);
  };

  const handleGlobalLogout = () => {
    setIsAdmin(false);
    setIsKioskMode(false);
    setActiveTab('kiosk');
  };

  const handleAnonymousLogin = () => {
    setIsKioskMode(true);
    setActiveTab('kiosk');
  };

  // --- Speech Logic ---
  const speakQueue = useCallback((queueObj: QueueItem) => {
    if (!window.speechSynthesis || !queueObj) return;

    const splitNumber = queueObj.number.split('').map(char => {
      if (char === '-') return ' ';
      if (char === '0') return 'nol ';
      return char + ' ';
    }).join('');

    const splitName = queueObj.nama;
    const textToSpeak = `Nomor antrean. ${splitNumber}. Atas nama. ${splitName}. Silakan menuju ke loket pendaftaran.`;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.rate = 0.85; 

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  // --- API Handlers ---
  const handleAmbilAntrean = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nextNum = queues.length + 1;
      const formattedNumber = `A-${nextNum.toString().padStart(3, '0')}`;
      
      const response = await fetch(`${API_URL}/api/queues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: formattedNumber,
          nama: formData.nama,
          asalSekolah: formData.asalSekolah,
          noHp: formData.noHp
        }),
      });

      if (response.ok) {
        const newQueue = await response.json();
        // Auto-add school if not exists
        if (!schools.some(s => s.nama === formData.asalSekolah)) {
          await fetch(`${API_URL}/api/schools`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: formData.asalSekolah }),
          });
        }
        
        fetchData();
        setFormData({ nama: '', asalSekolah: '', noHp: '' });
        setIsManualSchool(false);
        setModal({
          isOpen: true,
          title: 'BERHASIL!',
          message: `Nomor Antrean: ${formattedNumber}\nNama: ${newQueue.nama}\n\nSilakan tunggu giliran Anda.`,
          type: 'info'
        });
      }
    } catch (error) {
      setModal({ isOpen: true, title: 'Error', message: 'Gagal menghubungi server.', type: 'error' });
    }
  };

  const handlePanggilBerikutnya = async () => {
    if (config.servingIndex < queues.length - 1) {
      const nextIndex = config.servingIndex + 1;
      const nextQueue = queues[nextIndex];
      
      try {
        // Update config
        await fetch(`${API_URL}/api/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ servingIndex: nextIndex }),
        });
        
        // Update next queue status
        await fetch(`${API_URL}/api/queues/${nextQueue.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'serving' }),
        });
        
        // Mark previous as completed
        if (config.servingIndex >= 0) {
          await fetch(`${API_URL}/api/queues/${queues[config.servingIndex].id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' }),
          });
        }
        
        fetchData();
        speakQueue(nextQueue);
      } catch (error) {
        console.error("API Error:", error);
      }
    }
  };

  const handlePanggilUlang = () => {
    if (config.servingIndex >= 0 && config.servingIndex < queues.length) {
      speakQueue(queues[config.servingIndex]);
    }
  };

  const handleReset = () => {
    setModal({
      isOpen: true,
      title: 'Konfirmasi Reset',
      message: 'Hapus semua data antrean hari ini?',
      type: 'confirm',
      onConfirm: async () => {
        await fetch(`${API_URL}/api/reset`, { method: 'POST' });
        fetchData();
      }
    });
  };

  const handleUpdateParticipantStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_URL}/api/queues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantStatus: status }),
      });
      fetchData();
      if (selectedQueue && selectedQueue.id === id) {
        setSelectedQueue(prev => prev ? { ...prev, participantStatus: status as any } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/queues/${id}`, { method: 'DELETE' });
      fetchData();
      setSelectedQueue(null);
    } catch (err) {
      console.error(err);
    }
  };

  const updateConfig = async (updates: Partial<AppConfig>) => {
    try {
      await fetch(`${API_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(queues);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Queues");
    XLSX.writeFile(workbook, "Data_Antrean.xlsx");
  };

  const exportToHTML = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>Laporan Antrean</title>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Laporan Antrean PPDB</h1>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Sekolah</th>
                <th>HP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${queues.map(q => `
                <tr>
                  <td>${q.number}</td>
                  <td>${q.nama}</td>
                  <td>${q.asalSekolah}</td>
                  <td>${q.noHp}</td>
                  <td>${q.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setModal({
        isOpen: true,
        title: 'File Terlalu Besar',
        message: 'Ukuran logo maksimal adalah 2MB.',
        type: 'error'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateConfig({ logoUrl: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleBarcodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setModal({
        isOpen: true,
        title: 'File Terlalu Besar',
        message: 'Ukuran barcode maksimal adalah 2MB.',
        type: 'error'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateConfig({ barcodeUrl: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateConfig({ 
        appTitle: editTitle, 
        appSubtitle: editSubtitle 
      });
      setModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'Pengaturan aplikasi telah diperbarui.',
        type: 'info'
      });
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Gagal',
        message: 'Gagal menyimpan pengaturan.',
        type: 'error'
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const currentQueueObj = config.servingIndex >= 0 && config.servingIndex < queues.length ? queues[config.servingIndex] : null;
  const waitingCount = queues.length - (config.servingIndex + 1);
  const totalCount = queues.length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col relative selection:bg-blue-100">
      
      {/* Modal Filter */}
      <AnimatePresence>
        {modal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
            >
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${modal.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {modal.type === 'error' ? <AlertCircle className="h-6 w-6" /> : <Ticket className="h-6 w-6" />}
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800">{modal.title}</h3>
              <p className="text-slate-600 mb-8 whitespace-pre-wrap text-sm leading-relaxed">{modal.message}</p>
              <div className="flex justify-center space-x-3">
                {modal.type === 'confirm' && (
                  <button
                    onClick={() => setModal({ ...modal, isOpen: false })}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                    id="modal-cancel-btn"
                  >
                    Batal
                  </button>
                )}
                <button
                  onClick={() => {
                    if (modal.onConfirm) modal.onConfirm();
                    setModal({ ...modal, isOpen: false });
                  }}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-colors shadow-md ${modal.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  id="modal-confirm-btn"
                >
                  {modal.type === 'confirm' ? 'Ya, Lanjutkan' : 'Tutup'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md z-10 relative">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg cursor-pointer flex items-center justify-center overflow-hidden" onClick={() => { setIsKioskMode(false); setActiveTab('kiosk'); }}>
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
                ) : (
                  <Users className="h-6 w-6 text-blue-700" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">{config.appTitle}</h1>
                <p className="text-blue-200 text-sm">{config.appSubtitle}</p>
              </div>
            </div>
            
            {(isAdmin || isKioskMode) && (
              <div className="flex items-center gap-4">
                <div className="flex bg-blue-800/50 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('kiosk')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${activeTab === 'kiosk' ? 'bg-white text-blue-700 shadow' : 'text-blue-100 hover:text-white hover:bg-blue-600'}`}
                    id="tab-kiosk"
                  >
                    <Monitor className="h-4 w-4" />
                    <span>Layar & Kios</span>
                  </button>
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => setActiveTab('admin')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${activeTab === 'admin' ? 'bg-white text-blue-700 shadow' : 'text-blue-100 hover:text-white hover:bg-blue-600'}`}
                        id="tab-admin"
                      >
                        <Lock className="h-4 w-4" />
                        <span>Loket</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('database')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${activeTab === 'database' ? 'bg-white text-blue-700 shadow' : 'text-blue-100 hover:text-white hover:bg-blue-600'}`}
                        id="tab-database"
                      >
                        <TableIcon className="h-4 w-4" />
                        <span>Data Antrean</span>
                      </button>
                    </>
                  )}
                </div>
                {isAdmin && (
                  <button 
                    onClick={handleGlobalLogout}
                    className="bg-red-500 hover:bg-red-600 p-2 rounded-lg text-white transition-colors"
                    title="Logout Akun"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                )}
                {!isAdmin && isKioskMode && (
                  <button 
                    onClick={() => { setIsKioskMode(false); setActiveTab('kiosk'); }}
                    className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg text-white transition-colors border border-blue-400"
                    title="Kembali ke Menu Utama"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full overflow-hidden flex flex-col">
        
        {!isAdmin && !isKioskMode ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            {/* Guest / Public Access */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-blue-100 max-w-lg w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400"></div>
              
              <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative group overflow-hidden">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="School Logo" className="w-16 h-16 object-contain" />
                ) : (
                  <StudentAnimation className="scale-75" />
                )}
              </div>
              
              <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">{config.appTitle}</h2>
              <p className="text-slate-500 mb-2 leading-relaxed px-4">
                {config.appSubtitle}
              </p>
              <div className="flex flex-col items-center mb-8">
                <div className="text-blue-600 font-bold text-lg mb-1">
                  {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="text-slate-400 text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>
              </div>

              {config.barcodeUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-3 bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col items-center mx-auto w-fit"
                >
                  <img src={config.barcodeUrl} alt="Scan Barcode" className="w-24 h-24 object-contain mb-1" />
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Scan Kios Mobile</p>
                </motion.div>
              )}

              <button 
                onClick={handleAnonymousLogin}
                disabled={authLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black py-5 px-8 rounded-2xl shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 group mb-4"
              >
                {authLoading ? (
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span className="text-xl">MASUK KE KIOS ANTREAN</span>
                    <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 font-medium italic">
                create : @ajisosiologi, TAHUN 2026
              </p>
            </motion.div>

            {/* Admin Access Toggle or Link */}
            <button 
              onClick={() => {
                if (isKioskMode) {
                  setIsKioskMode(false);
                }
                setAuthMode('login'); // Always default to login when opening panel
              }}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors mb-4"
            >
              <Lock className="h-3 w-3" />
              <span>Akses Panel Petugas Loket</span>
            </button>

            {/* Admin Form */}
            {!isAdmin && !isKioskMode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-sm w-full"
              >
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 justify-center">
                  <Lock className="h-4 w-4 text-blue-600" />
                  LOGIN PETUGAS
                </h3>
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <input 
                      type="password" 
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                      placeholder="Password"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    {authLoading ? 'Memproses...' : 'MASUK SEKARANG'}
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        ) : activeTab === 'kiosk' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            
            {/* Display Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col h-full min-h-[500px]">
                <div className="bg-slate-800 p-4 flex items-center justify-center space-x-2">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
                  ) : (
                    <Monitor className="text-white h-5 w-5" />
                  )}
                  <h2 className="text-white font-semibold tracking-wider uppercase text-sm flex items-center gap-2">
                    Layar Informasi Publik 
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  </h2>
                </div>

                <div className="bg-slate-100/50 px-6 py-2 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="text-slate-800 font-black text-lg tabular-nums">
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
                  <AnimatePresence>
                    {isSpeaking && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-6 right-6 flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-200"
                      >
                        <Volume2 className="h-5 w-5 animate-bounce" />
                        <span className="text-sm font-bold">Memanggil...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <p className="text-2xl text-slate-500 font-medium mb-4">Nomor Antrean Saat Ini</p>
                  <motion.div 
                    key={currentQueueObj?.number || 'empty'}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-blue-50 border-4 border-blue-100 rounded-3xl p-10 mb-6 w-full max-w-md shadow-inner"
                  >
                    <span className="text-7xl md:text-9xl font-black text-blue-700 tabular-nums tracking-tighter">
                      {currentQueueObj ? currentQueueObj.number : '---'}
                    </span>
                  </motion.div>
                  
                  {currentQueueObj ? (
                    <div className="mb-6 space-y-1">
                      <p className="text-2xl font-bold text-slate-800 uppercase line-clamp-1">{currentQueueObj.nama}</p>
                      <p className="text-slate-500 line-clamp-1">{currentQueueObj.asalSekolah}</p>
                    </div>
                  ) : (
                    <div className="mb-6 text-slate-400 italic">Belum ada antrean yang dipanggil</div>
                  )}

                  <div className="bg-green-100 text-green-800 px-8 py-4 rounded-full font-bold text-2xl flex items-center shadow-sm mb-8">
                    Menuju: LOKET PENDAFTARAN
                  </div>

                  {/* Waiting List in Public Screen */}
                  <div className="w-full mt-4 border-t border-slate-100 pt-6">
                    <h3 className="text-slate-500 font-bold mb-4 text-left flex items-center gap-2">
                       <Users className="h-4 w-4" />
                       MENUNGGU ANTREAN
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                       {queues.filter(q => q.status === 'waiting').slice(0, 4).map((q) => (
                         <div key={q.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left flex items-center gap-3">
                           <div className="bg-blue-600 text-white font-black px-2 py-1 rounded text-sm shrink-0">
                             {q.number}
                           </div>
                           <div className="overflow-hidden">
                             <p className="font-bold text-sm text-slate-800 truncate">{q.nama}</p>
                             <p className="text-[10px] text-slate-500 truncate">{q.asalSekolah}</p>
                           </div>
                         </div>
                       ))}
                       {waitingCount > 4 && (
                         <div className="col-span-2 text-center text-xs text-slate-400 italic mt-2">
                            Dan {waitingCount - 4} pendaftar lainnya dalam antrean...
                         </div>
                       )}
                       {waitingCount === 0 && (
                         <div className="col-span-2 text-center text-xs text-slate-400 py-4 italic">
                            Tidak ada antrean menunggu saat ini.
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border-t border-slate-100 p-6 grid grid-cols-2 divide-x divide-slate-200">
                  <div className="text-center px-4">
                    <p className="text-sm text-slate-500 uppercase font-semibold">Total Pendaftar</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{totalCount}</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm text-slate-500 uppercase font-semibold">Menunggu Giliran</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">{waitingCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kiosk Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
                  ) : (
                    <Ticket className="text-blue-600 h-6 w-6" />
                  )}
                  <h3 className="text-lg font-bold text-slate-800">Kios Pengambilan Tiket</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{currentTime.toLocaleDateString('id-ID', { weekday: 'long' })}</p>
                  <p className="text-xs font-bold text-slate-700">{currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Silakan lengkapi data diri Anda di bawah ini untuk mengambil nomor antrean.
              </p>
              
              <form onSubmit={handleAmbilAntrean} className="space-y-5 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center space-x-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Nama Lengkap</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center space-x-2">
                    <Building className="h-4 w-4 text-slate-400" />
                    <span>Asal Sekolah</span>
                  </label>
                  
                  {!isManualSchool ? (
                    <div className="relative group">
                      <select 
                        required
                        id="asalSekolah"
                        value={formData.asalSekolah}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setIsManualSchool(true);
                            setFormData({...formData, asalSekolah: ''});
                          } else {
                            setFormData({...formData, asalSekolah: e.target.value});
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none bg-white font-medium cursor-pointer"
                      >
                        <option value="" disabled>--- Pilih Sekolah ---</option>
                        {schools.map(school => (
                          <option key={school.id} value={school.nama}>{school.nama}</option>
                        ))}
                        <option value="ADD_NEW" className="text-blue-600 font-bold bg-blue-50">+ SEKOLAH LAINNYA (INPUT MANUAL)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="h-5 w-5 rotate-90" />
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          required
                          autoFocus
                          value={formData.asalSekolah}
                          onChange={(e) => setFormData({...formData, asalSekolah: e.target.value})}
                          placeholder="Ketik nama sekolah baru..."
                          className="flex-1 px-4 py-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setIsManualSchool(false);
                            setFormData({...formData, asalSekolah: ''});
                          }}
                          className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-bold text-xs uppercase"
                        >
                          Batal
                        </button>
                      </div>
                      <p className="text-[10px] text-blue-600 font-medium">Asal sekolah baru akan tersimpan otomatis ke daftar sistem.</p>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>Nomor Handphone</span>
                  </label>
                  <input 
                    type="tel" 
                    required
                    id="noHp"
                    value={formData.noHp}
                    onChange={(e) => setFormData({...formData, noHp: e.target.value})}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center space-x-3 group disabled:opacity-50"
                    id="submit-ticket-btn"
                  >
                    <Printer className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span className="text-lg">MASUKKAN DATA & CETAK</span>
                  </button>
                </div>

                <div className="mt-4 text-center border-t border-slate-100 pt-4">
                  <p className="text-[10px] text-slate-400 font-medium italic">
                    create : @ajisosiologi, TAHUN 2026
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="flex flex-col h-full space-y-6">
            {!isAdmin ? (
              <div className="flex-1 flex items-center justify-center">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
                >
                  <div className="text-center mb-8">
                    <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
                      <Lock className="h-8 w-8 text-blue-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Akses Database</h2>
                    <p className="text-slate-500 text-sm mt-2">Gunakan login loket untuk mengakses data detail.</p>
                  </div>
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Username Petugas</label>
                      <input 
                        type="text" 
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Username"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Password</label>
                      <input 
                        type="password" 
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="••••••"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                    >
                      {authLoading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <span>{authMode === 'login' ? 'Masuk Database' : 'Daftar Akun Baru'}</span>
                      )}
                    </button>
                    
                    <div className="text-center mt-2">
                       <button 
                         type="button"
                         onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                         className="text-[10px] text-blue-600 font-bold hover:underline"
                       >
                         {authMode === 'login' ? 'Belum punya akun loket? Daftar di sini' : 'Sudah punya akun? Login di sini'}
                       </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-full overflow-hidden"
              >
                {/* Database Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <TableIcon className="h-6 w-6 text-blue-600" />
                        Database Antrean Pendaftar
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">Kelola dan lihat rincian pendaftar hari ini secara detail.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Export Excel</span>
                      </button>
                      <button onClick={exportToHTML} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
                        <Printer className="h-4 w-4" />
                        <span>Cetak Laporan</span>
                      </button>
                    </div>
                  </div>

                  {/* Filters & Search */}
                  <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Cari nama, nomor, atau sekolah..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        {(['all', 'waiting', 'serving', 'completed'] as const).map((status) => {
                          const count = status === 'all' 
                            ? queues.length 
                            : queues.filter(q => q.status === status).length;
                          
                          return (
                            <button
                              key={status}
                              onClick={() => setFilterStatus(status)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                filterStatus === status 
                                  ? 'bg-blue-600 text-white shadow-md' 
                                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                              }`}
                            >
                              <span>
                                {status === 'all' ? 'Semua' : status === 'waiting' ? 'Menunggu' : status === 'serving' ? 'Melayani' : 'Selesai'}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                                filterStatus === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 bg-white z-10 border-b border-slate-200 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Antrean</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Peserta</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Seleksi</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Antrean</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu Daftar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queues
                        .filter(q => {
                          const matchesSearch = q.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                              q.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                              q.asalSekolah.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
                          return matchesSearch && matchesStatus;
                        })
                        .map((q) => (
                          <tr 
                            key={q.id} 
                            onClick={() => setSelectedQueue(q)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4">
                              <span className="font-black text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">{q.number}</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800">
                              <div>{q.nama}</div>
                              <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                                <Building className="h-2.5 w-2.5" /> {q.asalSekolah} • <Phone className="h-2.5 w-2.5" /> {q.noHp}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold ${
                                q.participantStatus === 'Diterima' ? 'bg-emerald-100 text-emerald-700' :
                                q.participantStatus === 'Ditolak' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {q.participantStatus || 'Terdaftar'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                q.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                q.status === 'serving' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {q.status === 'completed' ? 'Selesai' : q.status === 'serving' ? 'Melayani' : 'Menunggu'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(q.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  
                  {queues.length === 0 && (
                    <div className="py-20 text-center">
                      <Ticket className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-500">Belum ada data antrean.</p>
                    </div>
                  )}
                </div>

                {/* Queue Detail Modal */}
                <AnimatePresence>
                  {selectedQueue && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                      onClick={() => setSelectedQueue(null)}
                    >
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="bg-blue-700 px-8 py-10 text-white relative">
                          <button 
                            onClick={() => setSelectedQueue(null)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <RotateCcw className="h-5 w-5 rotate-45" />
                          </button>
                          <div className="flex flex-col items-center">
                            <span className="text-blue-200 text-xs font-black uppercase tracking-[0.2em] mb-2 text-center">Nomor Antrean</span>
                            <h2 className="text-7xl font-black tracking-tighter mb-4">{selectedQueue.number}</h2>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.1em] ${
                              selectedQueue.status === 'completed' ? 'bg-emerald-500 text-white' :
                              selectedQueue.status === 'serving' ? 'bg-blue-500 text-white animate-pulse' :
                              'bg-orange-500 text-white'
                            }`}>
                              {selectedQueue.status === 'completed' ? 'Status: Selesai' : 
                               selectedQueue.status === 'serving' ? 'Status: Sedang Dilayani' : 
                               'Status: Menunggu Antrean'}
                            </span>
                          </div>
                        </div>
                        <div className="p-8 space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</p>
                              <p className="text-lg font-bold text-slate-800">{selectedQueue.nama}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor HP</p>
                              <p className="text-lg font-bold text-slate-800">{selectedQueue.noHp}</p>
                            </div>
                            <div className="col-span-2 space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asal Sekolah</p>
                              <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Building className="h-5 w-5 text-blue-600" />
                                {selectedQueue.asalSekolah}
                              </p>
                            </div>
                            <div className="col-span-2 space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Terdaftar</p>
                              <p className="text-slate-600 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                {new Date(selectedQueue.timestamp).toLocaleString('id-ID', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="pt-4 space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update Status Seleksi</p>
                            <div className="flex gap-2">
                                {(['Terdaftar', 'Diterima', 'Ditolak'] as const).map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => handleUpdateParticipantStatus(selectedQueue.id, s)}
                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                      selectedQueue.participantStatus === s || (!selectedQueue.participantStatus && s === 'Terdaftar')
                                        ? s === 'Diterima' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' :
                                          s === 'Ditolak' ? 'bg-red-600 text-white border-red-600 shadow-md' :
                                          'bg-slate-800 text-white border-slate-800 shadow-md'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-4 pt-6 border-t border-slate-100">
                             <button 
                                onClick={() => {
                                  setModal({
                                    isOpen: true,
                                    title: 'Konfirmasi Hapus',
                                    message: `Apakah Anda yakin ingin menghapus data antrean ${selectedQueue.number} atas nama ${selectedQueue.nama}? Tindakan ini tidak dapat dibatalkan.`,
                                    type: 'confirm',
                                    onConfirm: () => handleDeleteItem(selectedQueue.id)
                                  });
                                }}
                                className="flex-1 bg-red-50 text-red-600 font-bold py-3 px-4 rounded-xl hover:bg-red-100 transition-colors"
                             >
                               Hapus Data
                             </button>
                             <button 
                                onClick={() => setSelectedQueue(null)}
                                className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-200 transition-colors"
                             >
                               Tutup
                             </button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="flex justify-center items-start h-full overflow-auto">
            {!isAdmin ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-8 mt-10"
              >
                <div className="text-center mb-8">
                  <div className="bg-blue-50 p-4 rounded-full inline-block mb-4">
                    <Lock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Login Petugas</h2>
                  <p className="text-slate-400 text-xs mt-2 font-medium">Silakan akses panel kendali antrean</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  <input 
                    type="text" 
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Username"
                  />
                  <input 
                    type="password" 
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Password"
                  />
                  <button 
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 mt-2"
                  >
                    {authLoading ? 'Masuk...' : 'LOGIN PETUGAS'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <>
                {/* Student Character Animation to brighten up the booth */}
                <div className="hidden lg:flex flex-col items-center justify-center space-y-8">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/70 backdrop-blur-md p-16 rounded-[4rem] shadow-2xl border border-white flex flex-col items-center"
                  >
                    <StudentAnimation className="scale-125 mb-10" />
                    <div className="text-center space-y-3">
                      <h4 className="text-2xl font-black text-slate-800 tracking-tight">Antrean PPDB 2026</h4>
                      <p className="text-slate-500 font-medium max-w-xs leading-relaxed">
                        Selamat bertugas! Pastikan verifikasi data siswa dilakukan dengan teliti.
                      </p>
                    </div>
                  </motion.div>
                  
                  <div className="flex gap-3">
                    <motion.div animate={{ width: [12, 48, 12] }} transition={{ duration: 4, repeat: Infinity }} className="h-3 bg-blue-500/30 rounded-full" />
                    <motion.div animate={{ width: [48, 12, 48] }} transition={{ duration: 4, repeat: Infinity }} className="h-3 bg-slate-300 rounded-full" />
                  </div>
                </div>

                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Control Panel */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                      <div className="flex items-center space-x-2">
                        <Mic className="h-5 w-5" />
                        <h2 className="font-semibold">Panel Loket Utama</h2>
                      </div>
                      <button 
                        onClick={handleGlobalLogout} 
                        title="Keluar" 
                        className="hover:bg-emerald-700 p-1 rounded transition"
                        id="logout-btn"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-center">
                        <p className="text-sm text-slate-500 uppercase font-bold mb-2">Antrean Berikutnya</p>
                        {config.servingIndex < queues.length - 1 ? (
                          <>
                            <p className="text-4xl font-black text-slate-800 mb-2">{queues[config.servingIndex + 1].number}</p>
                            <p className="text-lg font-medium text-blue-600">{queues[config.servingIndex + 1].nama}</p>
                            <p className="text-sm text-slate-500">{queues[config.servingIndex + 1].asalSekolah}</p>
                          </>
                        ) : (
                          <p className="text-xl font-bold text-slate-400 py-4">Tidak ada antrean</p>
                        )}
                      </div>

                      <button 
                        onClick={handlePanggilBerikutnya}
                        disabled={config.servingIndex >= queues.length - 1 || isSpeaking}
                        className={`w-full py-5 px-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center space-x-2 text-lg
                          ${config.servingIndex >= queues.length - 1 || isSpeaking 
                            ? 'bg-slate-300 cursor-not-allowed' 
                            : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 hover:-translate-y-1'}`}
                        id="call-next-btn"
                      >
                        <Volume2 className={`h-6 w-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
                        <span>{isSpeaking ? 'Sedang Memanggil...' : 'Panggil Selanjutnya'}</span>
                        <ChevronRight className="h-6 w-6" />
                      </button>

                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={handlePanggilUlang}
                          disabled={config.servingIndex < 0 || isSpeaking}
                          className="py-3 px-4 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                          id="recall-btn"
                        >
                          <Volume2 className="h-5 w-5" />
                          <span className="text-xs">Panggil Ulang</span>
                        </button>
                        
                        <button 
                          onClick={handleReset}
                          className="py-3 px-4 rounded-xl font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all flex flex-col items-center justify-center gap-1"
                          id="reset-btn"
                        >
                          <RotateCcw className="h-5 w-5" />
                          <span className="text-xs">Reset Antrean</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Settings Panel */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="bg-slate-700 p-4 flex items-center space-x-2 text-white">
                      <Settings className="h-5 w-5" />
                      <h2 className="font-semibold">Pengaturan Tampilan</h2>
                    </div>
                    <div className="p-6 space-y-4 bg-slate-50">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Logo Sekolah</label>
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-white shrink-0">
                            {config.logoUrl ? (
                              <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <Building className="h-6 w-6 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="cursor-pointer bg-white border border-slate-300 hover:border-blue-500 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                              <Upload className="h-4 w-4" />
                              <span>Pilih Logo</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">Format: JPG, PNG (Maks 2MB)</p>
                          </div>
                          {config.logoUrl && (
                            <button 
                              onClick={() => updateConfig({ logoUrl: '' })}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Logo"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Barcode Web Kios</label>
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-white shrink-0">
                            {config.barcodeUrl ? (
                              <img src={config.barcodeUrl} alt="Barcode" className="w-full h-full object-contain" />
                            ) : (
                              <QrCode className="h-6 w-6 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="cursor-pointer bg-white border border-slate-300 hover:border-blue-500 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                              <Upload className="h-4 w-4" />
                              <span>Pilih Barcode</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleBarcodeUpload} />
                            </label>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">Format: JPG, PNG (Maks 2MB)</p>
                          </div>
                          {config.barcodeUrl && (
                            <button 
                              onClick={() => updateConfig({ barcodeUrl: '' })}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Barcode"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Aplikasi</label>
                        <input 
                          type="text" 
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Misal: SPMB 2026"
                          id="app-title-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Keterangan Tambahan</label>
                        <input 
                          type="text" 
                          value={editSubtitle}
                          onChange={(e) => setEditSubtitle(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Misal: Universitas Teknologi Terpadu"
                          id="app-subtitle-input"
                        />
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={handleSaveSettings}
                          disabled={isSavingSettings || (editTitle === config.appTitle && editSubtitle === config.appSubtitle)}
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSavingSettings ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          <span>SIMPAN PERUBAHAN</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Column */}
                <div className="space-y-6">
                  {/* Quick Overview */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                       <Ticket className="h-5 w-5 text-blue-600" />
                       Status Antrean Saat Ini
                    </h3>
                    <div className="space-y-4">
                       <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-xs font-bold text-blue-600 uppercase">Sedang Dilayani</p>
                          <p className="text-2xl font-black text-blue-800 mt-1">{currentQueueObj?.number || '---'}</p>
                          <p className="text-sm text-blue-700 truncate">{currentQueueObj?.nama || 'Tidak ada'}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                             <p className="text-xs font-bold text-orange-600 uppercase">Menunggu</p>
                             <p className="text-2xl font-black text-orange-800">{waitingCount}</p>
                          </div>
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                             <p className="text-xs font-bold text-emerald-600 uppercase">Selesai</p>
                             <p className="text-2xl font-black text-emerald-800">{totalCount - waitingCount}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

