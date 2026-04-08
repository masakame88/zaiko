import React, { useState, useMemo, useEffect, memo } from 'react';
import { 
  Package, Layers, Plus, Trash2, Wallet, 
  Briefcase, Calendar, Shapes, Edit2, Download, X, 
  GripVertical, Cloud, Check, RefreshCw, AlertCircle,
  Upload, RotateCcw, AlertTriangle, Save, LogOut
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, updateDoc, deleteDoc, 
  onSnapshot, query, addDoc, writeBatch, getDocs
} from 'firebase/firestore';

// --- Firebase Setup ---
let app, auth, db;
let appId = 'inventory-system-v2';
let isEnvConfigured = false;
let isCanvasEnv = false;

// あなたのFirebase設定 (Vercel/本番用)
const YOUR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBcy2KW6nqc1RfMq7nb2fJ48WO3s7_wUS8",
  authDomain: "zaiko-app-eb40b.firebaseapp.com",
  projectId: "zaiko-app-eb40b",
  storageBucket: "zaiko-app-eb40b.firebasestorage.app",
  messagingSenderId: "608491890483",
  appId: "1:608491890483:web:de3c39400bf9fa583f8046"
};

try {
  // 1. AIのCanvas環境（プレビュー）用を「最優先」でチェック
  if (typeof window !== 'undefined' && window.__firebase_config) {
    const firebaseConfig = JSON.parse(window.__firebase_config);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = window.__app_id || appId;
    isEnvConfigured = true;
    isCanvasEnv = true;
  } 
  // 2. Vercelなどの本番環境用 (ユーザーのFirebaseプロジェクト)
  else if (YOUR_FIREBASE_CONFIG && YOUR_FIREBASE_CONFIG.apiKey) {
    app = initializeApp(YOUR_FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    isEnvConfigured = true;
    isCanvasEnv = false;
  }
} catch (e) {
  console.warn("Firebase configuration check:", e);
}

// データベースのパス
const getBasePath = (t) => isCanvasEnv 
  ? collection(db, 'artifacts', appId, 'public', 'data', t) 
  : collection(db, 'inventory', 'master', t);

const getDocPath = (t, id) => isCanvasEnv 
  ? doc(db, 'artifacts', appId, 'public', 'data', t, id)
  : doc(db, 'inventory', 'master', t, id);

// --- 初期データ ---
const INITIAL_DATA = {
  products: [
    { name: 'KP88携帯用', price: 267.3, prevQuantity: 0, quantity: 2992 },
    { name: 'カニパック', price: 1165.3, prevQuantity: 0, quantity: 243 },
    { name: 'カニパック88', price: 1211.5, prevQuantity: 0, quantity: 660 },
    { name: 'カニパック 90', price: 982.8, prevQuantity: 57, quantity: 572 },
    { name: 'KPKP280粒', price: 1345.1, prevQuantity: 0, quantity: 240 },
    { name: 'カニパックスA 60g', price: 1290, prevQuantity: 0, quantity: 445 },
    { name: 'KPKP 21-S', price: 1437, prevQuantity: 0, quantity: 81 },
    { name: 'KPKP 21-H', price: 993.1, prevQuantity: 0, quantity: 199 },
    { name: 'カニパックアレ 100ml', price: 1040, prevQuantity: 0, quantity: 168 },
    { name: 'カニパックLR', price: 3253, prevQuantity: 0, quantity: 397 },
    { name: 'カニパックKR', price: 1670, prevQuantity: 0, quantity: 66 },
    { name: 'キトナコス 27.10', price: 1832.6, prevQuantity: 156, quantity: 131 },
    { name: '缶スタンド', price: 20, prevQuantity: 0, quantity: 100 },
    { name: '斜め刃爪切り', price: 219, prevQuantity: 191, quantity: 180 },
    { name: '除菌ウエットレジカゴバッグ', price: 110, prevQuantity: 74, quantity: 69 }
  ],
  materials: [
    { name: 'カニパック(240)6本箱36本箱シール', company: 'ウキシマメディカル', price: 2, prevQuantity: 0, quantity: 4459 },
    { name: 'KPKP共通ホワイトキャップ', company: 'ウキシマメディカル', price: 20.2, prevQuantity: 0, quantity: 1263 },
    { name: '新KPKP280 ボトル', company: 'ウキシマメディカル', price: 75, prevQuantity: 0, quantity: 2367 },
    { name: 'KPKP280 ラベル', company: 'ウキシマメディカル', price: 43, prevQuantity: 1971, quantity: 53 },
    { name: 'KPKP280 化粧箱', company: 'ウキシマメディカル', price: 88, prevQuantity: 0, quantity: 474 },
    { name: 'KPKP280 塩ビシュ', company: 'ウキシマメディカル', price: 5.4, prevQuantity: 446, quantity: 1971 },
    { name: 'KPKP280 6本箱', company: 'ウキシマメディカル', price: 222, prevQuantity: 53, quantity: 446 },
    { name: 'KPKP280 36本箱シール', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 100 },
    { name: 'カニパックKR ボトル', company: 'ウキシマメディカル', price: 39.8, prevQuantity: 0, quantity: 21 },
    { name: 'カニパックKRボトル用シュリンク', company: 'ウキシマメディカル', price: 2.9, prevQuantity: 0, quantity: 14169 },
    { name: '共通カニパック 6本箱', company: '当社', price: 78.6, prevQuantity: 0, quantity: 0 },
    { name: '新共通カニパック2021 36本箱', company: '当社', price: 88, prevQuantity: 247, quantity: 0 },
    { name: '中仕切り', company: '当社', price: 5.6, prevQuantity: 4200, quantity: 0 }
  ],
  rawMaterials: [
    { name: 'コーヨーキトサン FH-80<カニ由来>', company: '中日本カプセル', price: 0, prevQuantity: 0.508, quantity: 0.508 },
    { name: '天然にがり', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 0 }
  ]
};

// --- コンポーネント定義 ---

const QuantityInput = memo(({ value, onUpdate }) => {
  const [val, setVal] = useState(value);
  useEffect(() => { setVal(value); }, [value]);
  const handleBlur = () => {
    const num = Number(val);
    if (val === '' || isNaN(num) || num < 0) { setVal(value); } 
    else if (num !== value) { onUpdate(num); }
  };
  return (
    <input
      type="number" inputMode="decimal" value={val}
      onChange={(e) => setVal(e.target.value)} onBlur={handleBlur}
      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
      className="w-24 px-2 py-1 text-right text-slate-800 font-bold border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm transition-all"
    />
  );
});

const EditableCell = memo(({ value, type = "text", onUpdate, format }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);
  const commitEdit = () => {
    setIsEditing(false);
    const finalVal = type === 'number' ? Number(val) : val;
    if (finalVal !== value) onUpdate(finalVal);
  };
  if (isEditing) {
    return (
      <input
        type={type} value={val} autoFocus
        onChange={(e) => setVal(e.target.value)} onBlur={commitEdit}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        className="w-full px-2 py-1 text-sm border border-indigo-400 rounded outline-none bg-white"
      />
    );
  }
  return (
    <div onClick={() => { setVal(value); setIsEditing(true); }} className="group cursor-pointer hover:bg-indigo-50 px-2 py-1 -mx-2 rounded flex items-center justify-between overflow-hidden transition-colors">
      <span className="truncate">{format ? format(value) : value}</span>
      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50 flex-shrink-0 ml-2" />
    </div>
  );
});

// --- Main App ---

export default function App() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState({ products: [], materials: [], rawMaterials: [] });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting to Database...');
  const [toastMessage, setToastMessage] = useState(''); 

  // ログイン用の状態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false); 
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const [type, setType] = useState('product');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [company, setCompany] = useState('当社');
  const [targetMonth, setTargetMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragType, setDragType] = useState(null);
  const [isDragOverDocument, setIsDragOverDocument] = useState(false);
  const [draggableRowId, setDraggableRowId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  useEffect(() => {
    const handleWindowDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) { setIsDragOverDocument(true); }
    };
    window.addEventListener("dragover", handleWindowDragOver);
    return () => window.removeEventListener("dragover", handleWindowDragOver);
  }, []);

  // Auth
  useEffect(() => {
    if (!isEnvConfigured) { setLoading(false); return; }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false); // 未ログイン時はローディングを解除してログイン画面を表示
      }
    });

    const initAuth = async () => {
      try {
        setConnectionStatus("認証プロセスを開始...");
        if (isCanvasEnv && window.__initial_auth_token) {
          // AIのプレビュー環境では自動ログイン
          await signInWithCustomToken(auth, window.__initial_auth_token);
        }
        // 本番環境（isCanvasEnvがfalse）では自動ログインせず、ユーザーの入力を待つ
      } catch (err) { 
        console.error("Auth error:", err); 
        setErrorMessage(`認証エラー: ${err.message || err.code}`);
        setLoading(false);
      }
    };
    initAuth();

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setLoginError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setInventory({ products: [], materials: [], rawMaterials: [] });
  };

  // Data Listeners
  useEffect(() => {
    if (!user || !isEnvConfigured) return;
    const colNames = ['products', 'materials', 'rawMaterials'];
    const unsubs = colNames.map(colName => {
      return onSnapshot(query(getBasePath(colName)), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999) || (a.createdAt || 0) - (b.createdAt || 0));
        setInventory(prev => ({ ...prev, [colName]: data }));
        setLoading(false);
      }, (err) => {
        if (err.code === 'permission-denied') {
          setErrorMessage("【重要】Firebaseのアクセス権限がありません。Firestoreのルールを『allow read, write: if request.auth != null;』に変更してください。");
        }
      });
    });
    return () => unsubs.forEach(u => u());
  }, [user]);

  const updateItem = async (t, id, updates) => {
    if (!user || !isEnvConfigured) return;
    try {
      await updateDoc(getDocPath(t + 's', id), updates);
      showToast("変更をクラウドに保存しました");
    } catch (err) {
      setErrorMessage(`更新エラー: ${err.message}`);
    }
  };

  const removeItem = async (t, id) => {
    if (!user || !isEnvConfigured) return;
    try {
      await deleteDoc(getDocPath(t + 's', id));
      showToast("データを削除しました");
    } catch (err) {
      setErrorMessage(`削除エラー: ${err.message}`);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user || !name || !price || !quantity || !isEnvConfigured) return;
    const newItem = {
      name, price: Number(price), prevQuantity: 0, quantity: Number(quantity),
      company: (type === 'product' ? '-' : company),
      createdAt: Date.now(), order: Date.now() 
    };
    try {
      await addDoc(getBasePath(type + 's'), newItem);
      setName(''); setPrice(''); setQuantity(''); setIsModalOpen(false);
      showToast("新規データを追加しました");
    } catch (err) {
      setErrorMessage(`追加エラー: ${err.message}`);
    }
  };

  const restoreInitialData = async () => {
    if (!user || initializing || !isEnvConfigured) return;
    setInitializing(true);
    try {
      const batch = writeBatch(db);
      for (const colName of ['products', 'materials', 'rawMaterials']) {
        const colRef = getBasePath(colName);
        const snapshot = await getDocs(query(colRef));
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        INITIAL_DATA[colName].forEach((item, index) => {
          batch.set(doc(colRef), { ...item, order: index, createdAt: Date.now() });
        });
      }
      await batch.commit();
      setIsSyncModalOpen(false);
      showToast("初期データの復元とクラウドへの保存が完了しました");
    } catch (err) { setErrorMessage(`復元エラー: ${err.message}`); }
    setInitializing(false);
  };

  const processImportText = async (textToParse) => {
    if (!user || initializing || !textToParse.trim() || !isEnvConfigured) return;
    setInitializing(true);
    try {
      const lines = textToParse.split('\n');
      const batch = writeBatch(db);
      let importCount = 0;
      const parsedData = { products: [], materials: [], rawMaterials: [] };
      
      for (const line of lines) {
        if (!line.trim()) continue;
        const separator = line.includes('\t') ? '\t' : ',';
        const row = []; let currentVal = ''; let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === separator && !inQuotes) { row.push(currentVal.trim()); currentVal = ''; }
          else currentVal += char;
        }
        row.push(currentVal.trim());
        const mapping = { '商品': 'products', '資材': 'materials', '原材料': 'rawMaterials' };
        const typeStr = row[0] ? row[0].replace(/['"]/g, '').trim() : '';
        const key = mapping[typeStr];
        if (key && row.length >= 6) {
          parsedData[key].push({
            name: (row[1] || '').replace(/['"]/g, '').trim(), 
            company: (row[2] === '-' || row[2] === '"-"') ? '' : (row[2] || '').replace(/['"]/g, '').trim(), 
            price: Number((row[3] || '0').replace(/[,¥"']/g, '')),
            prevQuantity: Number((row[4] || '0').replace(/[,¥"']/g, '')), 
            quantity: Number((row[5] || '0').replace(/[,¥"']/g, '')),
          });
          importCount++;
        }
      }
      
      if (importCount === 0) throw new Error("有効なデータが見つかりませんでした。");
      
      for (const colName of ['products', 'materials', 'rawMaterials']) {
        const colRef = getBasePath(colName);
        const snap = await getDocs(query(colRef));
        snap.docs.forEach(d => batch.delete(d.ref));
        parsedData[colName].forEach((item, index) => {
          batch.set(doc(colRef), { ...item, createdAt: Date.now() + index, order: Date.now() + index });
        });
      }
      
      await batch.commit();
      setIsImportModalOpen(false); setImportText('');
      showToast("CSVデータの読み込みとクラウドへの保存が完了しました");
    } catch (err) { setErrorMessage(`読み込みエラー: ${err.message}`); }
    setInitializing(false);
  };

  const handleDrop = async (e, dropIdx, listType) => {
    if (draggedIdx === null || dragType !== listType || draggedIdx === dropIdx || !isEnvConfigured) {
      setDraggedIdx(null); setDragType(null); setDraggableRowId(null);
      return;
    }
    const list = [...inventory[listType + 's']];
    const [moved] = list.splice(draggedIdx, 1);
    list.splice(dropIdx, 0, moved);
    for (let i = 0; i < list.length; i++) {
      if (list[i].order !== i) await updateItem(listType, list[i].id, { order: i });
    }
    setDraggedIdx(null); setDragType(null); setDraggableRowId(null);
  };

  const displayMonthInfo = useMemo(() => {
    const [y, m] = targetMonth.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return { label: `${date.getFullYear()}年${date.getMonth() + 1}月分` };
  }, [targetMonth]);

  const totals = useMemo(() => {
    const calc = (list) => list.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const calcByCo = (list, co) => list.filter(i => i.company === co).reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const p = inventory.products, m = inventory.materials, r = inventory.rawMaterials;
    return {
      products: calc(p), grandTotal: calc(p) + calc(m) + calc(r),
      materials: calc(m), materialsOur: calcByCo(m, '当社'), materialsUkishima: calcByCo(m, 'ウキシマメディカル'), materialsNakanihon: calcByCo(m, '中日本カプセル'),
      rawMaterials: calc(r), rawMaterialsOur: calcByCo(r, '当社'), rawMaterialsUkishima: calcByCo(r, 'ウキシマメディカル'), rawMaterialsNakanihon: calcByCo(r, '中日本カプセル')
    };
  }, [inventory]);

  const formatCurrency = (v) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(v);

  const exportToCSV = () => {
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;
    const formatNum = (num) => String(num.toLocaleString());
    let csvContent = `${escapeCSV(displayMonthInfo.label + " 在庫報告書")}\n出力日,${escapeCSV(new Date().toLocaleDateString())}\n\n`;
    csvContent += `【サマリー】\n総合計金額,${escapeCSV(formatNum(totals.grandTotal))}\n`;
    csvContent += `商品 合計,${escapeCSV(formatNum(totals.products))}\n`;
    csvContent += `資材 合計,${escapeCSV(formatNum(totals.materials))}\n├ 当社,${escapeCSV(formatNum(totals.materialsOur))}\n├ ウキシマメディカル,${escapeCSV(formatNum(totals.materialsUkishima))}\n└ 中日本カプセル,${escapeCSV(formatNum(totals.materialsNakanihon))}\n`;
    csvContent += `原材料 合計,${escapeCSV(formatNum(totals.rawMaterials))}\n├ 当社,${escapeCSV(formatNum(totals.rawMaterialsOur))}\n├ ウキシマメディカル,${escapeCSV(formatNum(totals.rawMaterialsUkishima))}\n└ 中日本カプセル,${escapeCSV(formatNum(totals.rawMaterialsNakanihon))}\n\n`;
    csvContent += "種類,品名,取扱会社,単価,前月数量,今月数量,合計金額\n";
    const addRows = (list, label) => list.forEach(i => {
      csvContent += `${escapeCSV(label)},${escapeCSV(i.name)},${escapeCSV(i.company || '-')},${escapeCSV(formatNum(i.price))},${escapeCSV(formatNum(i.prevQuantity))},${escapeCSV(formatNum(i.quantity))},${escapeCSV(formatNum(i.price * i.quantity))}\n`;
    });
    addRows(inventory.products, "商品"); addRows(inventory.materials, "資材"); addRows(inventory.rawMaterials, "原材料");
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `${displayMonthInfo.label}_在庫表.csv`);
    link.click();
  };

  if (!isEnvConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-xl text-center">
          <Check className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-4">デプロイ成功</h2>
          <p className="text-slate-600 font-bold mb-4">しかし、データベースの設定（YOUR_FIREBASE_CONFIG）が正しくないようです。設定をGitHubに保存してください。</p>
        </div>
      </div>
    );
  }

  // ★ ログイン画面の表示 (ユーザーが存在せず、Canvas環境でもない場合)
  if (!user && !loading && !isCanvasEnv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg ring-4 ring-indigo-50">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center mb-8 text-slate-800">在庫管理システム</h2>
          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="bg-red-50 text-red-600 text-sm font-bold p-4 rounded-xl border border-red-100 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">メールアドレス</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all" 
                placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">パスワード</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all" 
                placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full py-4 mt-2 rounded-2xl text-white font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 active:scale-95 transition-all flex justify-center items-center">
              ログインして開始
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading || errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
        {errorMessage ? (
           <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-8 max-w-2xl w-full text-center shadow-xl">
             <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
             <h3 className="text-xl font-black mb-4">接続エラー</h3>
             <p className="text-slate-700 font-bold text-left bg-white p-4 rounded-xl border border-red-200">{errorMessage}</p>
           </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-400 font-black tracking-widest text-xs uppercase">{connectionStatus}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans relative select-none">
      
      {/* 保存成功トースト表示 */}
      <div className={`fixed bottom-20 right-6 z-50 transition-all duration-500 transform ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 font-bold border border-emerald-500/50 backdrop-blur-md">
          <Save className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      </div>

      {isDragOverDocument && (
        <div className="fixed inset-0 bg-indigo-900/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center border-8 border-indigo-500 border-dashed"
          onDragOver={(e) => e.preventDefault()} onDragLeave={() => setIsDragOverDocument(false)}
          onDrop={(e) => {
            e.preventDefault(); setIsDragOverDocument(false);
            const file = e.dataTransfer.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => processImportText(event.target.result);
              reader.readAsText(file); 
            }
          }}>
          <Download className="w-24 h-24 text-indigo-200 mb-8 animate-pulse" />
          <h2 className="text-5xl font-black text-white mb-6">CSVファイルをドロップ</h2>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg ring-4 ring-indigo-50"><Briefcase className="w-7 h-7 text-white" /></div>
            <div>
              <h1 className="text-2xl font-black">{displayMonthInfo.label} 在庫表</h1>
              <div className={`flex items-center text-[10px] font-black uppercase tracking-widest mt-1 px-3 py-1 rounded-full inline-flex border ${isCanvasEnv ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`}>
                <Cloud className="w-3 h-3 mr-1" />
                <span>{isCanvasEnv ? "Canvasプレビュー環境 (一時保存)" : "Vercel本番環境 (永続保存)"}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={exportToCSV} className="flex items-center space-x-1 bg-white text-indigo-600 px-3 py-2 rounded-xl border border-slate-300 hover:border-indigo-300 transition-all text-sm font-bold shadow-sm active:scale-95"><Upload className="w-4 h-4" /><span>CSV出力</span></button>
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center space-x-1 bg-white text-emerald-600 px-3 py-2 rounded-xl border border-slate-300 hover:border-emerald-300 transition-all text-sm font-bold shadow-sm active:scale-95"><Download className="w-4 h-4" /><span>CSV読込</span></button>
            <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center space-x-1 bg-white text-slate-600 px-3 py-2 rounded-xl border border-slate-300 hover:border-amber-400 transition-all text-sm font-bold shadow-sm active:scale-95"><RotateCcw className="w-4 h-4" /><span>初期化</span></button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all text-sm font-bold shadow-md active:scale-95"><Plus className="w-4 h-4" /><span>新規追加</span></button>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-300 shadow-sm">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input type="month" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} className="outline-none bg-transparent font-black text-indigo-600 cursor-pointer" />
            </div>
            {/* ★ ログアウトボタン */}
            {!isCanvasEnv && (
              <button onClick={handleLogout} className="flex items-center space-x-1 bg-white text-slate-500 ml-2 px-3 py-2 rounded-xl border border-slate-300 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all text-sm font-bold shadow-sm active:scale-95">
                <LogOut className="w-4 h-4" /><span>ログアウト</span>
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
            <div className="flex items-center space-x-2 text-indigo-100 mb-2"><Wallet className="w-5 h-5" /><h2 className="text-lg font-bold">総合計金額</h2></div>
            <p className="text-4xl font-black tracking-tight">{formatCurrency(totals.grandTotal)}</p>
          </div>
          {[
            { label: '商品', val: totals.products, icon: Package, col: 'emerald', sub: [] },
            { label: '資材', val: totals.materials, icon: Layers, col: 'amber', sub: [{ l: '自社', v: totals.materialsOur }, { l: 'ウキシマ', v: totals.materialsUkishima }, { l: '中日本', v: totals.materialsNakanihon }] },
            { label: '原材料', val: totals.rawMaterials, icon: Shapes, col: 'blue', sub: [{ l: '自社', v: totals.rawMaterialsOur }, { l: 'ウキシマ', v: totals.rawMaterialsUkishima }, { l: '中日本', v: totals.rawMaterialsNakanihon }] }
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2"><s.icon className={`w-5 h-5 text-${s.col}-500`} /><h2 className="text-lg font-bold text-slate-700">{s.label} 合計</h2></div>
                <p className="text-2xl font-black text-slate-800">{formatCurrency(s.val)}</p>
              </div>
              <div className="mt-4 space-y-1 text-[10px] text-slate-400 font-black uppercase tracking-wider border-t border-slate-50 pt-2">
                {s.sub.map(item => <div key={item.l} className="flex justify-between"><span>{item.l}</span><span className="text-slate-800">{formatCurrency(item.v)}</span></div>)}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8 pb-32">
          {[
            { title: '商品', list: inventory.products, type: 'product', color: 'emerald' },
            { title: '資材', list: inventory.materials, type: 'material', color: 'amber' },
            { title: '原材料', list: inventory.rawMaterials, type: 'rawMaterial', color: 'blue' }
          ].map(section => (
            <div key={section.title} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className={`bg-${section.color}-50/50 px-8 py-5 border-b border-${section.color}-100 flex items-center justify-between`}>
                <h3 className={`font-black text-${section.color}-800 text-lg`}>{section.title}リスト</h3>
                <div className={`text-${section.color}-800 font-black bg-white px-4 py-1.5 rounded-xl shadow-sm border border-${section.color}-100`}>
                  {formatCurrency(totals[section.type + 's'] || totals[section.type])}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase border-b border-slate-100">
                      <th className="px-4 py-5 w-12 text-center">#</th>
                      <th className="px-4 py-5">品名</th>
                      {section.type !== 'product' && <th className="px-4 py-5 text-center">取扱会社</th>}
                      <th className="px-6 py-5 text-right">数量 (前月 ➔ 今月)</th>
                      <th className="px-6 py-5 text-right">単価</th>
                      <th className="px-6 py-5 text-right">合計</th>
                      <th className="px-6 py-5 text-center w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {section.list.length === 0 ? (<tr><td colSpan="7" className="px-6 py-16 text-center text-slate-300 font-bold">データなし</td></tr>) : (
                      section.list.map((item, idx) => (
                        <tr key={item.id} 
                          draggable={draggableRowId === item.id} 
                          onDragStart={() => { setDraggedIdx(idx); setDragType(section.type); }} 
                          onDragEnd={() => { setDraggedIdx(null); setDragType(null); setDraggableRowId(null); }}
                          onDragOver={(e) => e.preventDefault()} 
                          onDrop={(e) => handleDrop(e, idx, section.type)}
                          className={`hover:bg-slate-50/80 transition-colors group ${draggedIdx === idx && dragType === section.type ? 'opacity-30' : ''}`}>
                          <td 
                            className="px-4 py-4 text-slate-300 cursor-grab active:cursor-grabbing"
                            onMouseEnter={() => setDraggableRowId(item.id)}
                            onMouseLeave={() => setDraggableRowId(null)}
                          >
                            <GripVertical className="w-5 h-5 mx-auto" />
                          </td>
                          <td className="px-4 py-4 font-black min-w-[240px]"><EditableCell value={item.name} onUpdate={(n) => updateItem(section.type, item.id, { name: n })} /></td>
                          {section.type !== 'product' && (<td className="px-4 py-4 text-center"><span className={`px-2 py-1 rounded text-[10px] font-black whitespace-nowrap ${item.company === '当社' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{item.company}</span></td>)}
                          <td className="px-6 py-4 text-right flex items-center justify-end">
                            <span className="text-slate-400 text-xs mr-3">{item.prevQuantity.toLocaleString()}</span>
                            <span className="mx-2 text-slate-200">➔</span>
                            <QuantityInput value={item.quantity} onUpdate={(q) => updateItem(section.type, item.id, { prevQuantity: item.quantity, quantity: q })} />
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-500"><EditableCell value={item.price} type="number" format={formatCurrency} onUpdate={(p) => updateItem(section.type, item.id, { price: p })} /></td>
                          <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => removeItem(section.type, item.id)} className="text-slate-300 hover:text-red-500 transition-all p-2 rounded-xl hover:bg-red-50"><Trash2 className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center"><Download className="w-8 h-8 mr-3 text-emerald-500" /><h3 className="text-xl font-black">CSV読み込み / 貼り付け</h3></div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={`種類\t品名\t取扱会社\t単価\t前月数量\t今月数量\n...`} className="w-full h-64 p-4 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 outline-none font-mono text-sm bg-slate-50/50" />
              <button onClick={() => processImportText(importText)} className="w-full py-4 mt-6 rounded-2xl text-white font-black bg-emerald-500 hover:bg-emerald-600 shadow-xl transition-all" disabled={initializing}>一括同期する</button>
            </div>
          </div>
        </div>
      )}

      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-amber-500">
            <div className="px-8 py-6 border-b bg-amber-50/50 flex items-center"><AlertTriangle className="w-8 h-8 mr-3 text-amber-500" /><h3 className="text-xl font-black">初期化</h3></div>
            <div className="p-8">
              <p className="text-slate-600 font-bold mb-6">全データを消去し、初期状態に戻します。よろしいですか？</p>
              <div className="flex space-x-4">
                <button onClick={() => setIsSyncModalOpen(false)} className="flex-1 py-4 rounded-2xl text-slate-600 bg-slate-100 font-black">キャンセル</button>
                <button onClick={restoreInitialData} className="flex-1 py-4 rounded-2xl text-white bg-amber-500 font-black shadow-xl" disabled={initializing}>実行する</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 flex items-center"><Plus className="w-6 h-6 mr-2 text-indigo-500" />新規登録</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8">
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                  {['product', 'material', 'rawMaterial'].map(t => (
                    <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${type === t ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>
                      {t === 'product' ? '商品' : t === 'material' ? '資材' : '原材料'}
                    </button>
                  ))}
                </div>
                <div><label className="block text-xs font-black text-slate-400 mb-2">品名</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none font-bold" /></div>
                {type !== 'product' && (
                  <div><label className="block text-xs font-black text-slate-400 mb-2">取扱会社</label><select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none font-bold"><option value="当社">当社</option><option value="ウキシマメディカル">ウキシマメディカル</option><option value="中日本カプセル">中日本カプセル</option></select></div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-black text-slate-400 mb-2">単価</label><input type="number" required step="any" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none font-bold" /></div>
                  <div><label className="block text-xs font-black text-slate-400 mb-2">数量</label><input type="number" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none font-bold" /></div>
                </div>
                <button type="submit" className="w-full py-4 px-6 rounded-2xl text-white font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl transition-all">追加する</button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      <footer className="fixed bottom-6 right-6 pointer-events-none z-40">
        <div className="bg-slate-900/90 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700/50 backdrop-blur-md">
          <div className={`w-2 h-2 rounded-full ${isCanvasEnv ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`}></div>
          <span className="text-[10px] font-black uppercase opacity-70">{user?.email || 'Admin'}</span>
        </div>
      </footer>
    </div>
  );
}
