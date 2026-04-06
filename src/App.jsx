import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Layers, Building2, Plus, Trash2, DollarSign, Wallet, 
  Store, Briefcase, Calendar, Shapes, Edit2, Download, X, 
  GripVertical, Cloud, Check, User, RefreshCw, AlertCircle,
  CloudDownload, AlertTriangle, UploadCloud
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, addDoc, writeBatch, getDocs
} from 'firebase/firestore';

// --- Firebase Setup ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'inventory-system-v2';

// --- アップロードされたCSVから読み取れた最新の初期データ ---
const INITIAL_DATA = {
  products: [
    { name: 'KP88携帯用', price: 267.3, prevQuantity: 0, quantity: 2992 },
    { name: 'カニパック', price: 1165.3, prevQuantity: 0, quantity: 243 },
    { name: 'カニパック88', price: 1211.5, prevQuantity: 0, quantity: 660 },
    { name: 'カニパック 90', price: 982.8, prevQuantity: 57, quantity: 572 },
    { name: 'KPKP280粒', price: 1345.1, prevQuantity: 0, quantity: 240 },
    { name: 'カニパックスA 60g', price: 1290, quantity: 445, prevQuantity: 0 },
    { name: 'KPKP 21-S', price: 1437, quantity: 81, prevQuantity: 0 },
    { name: 'KPKP 21-H', price: 993.1, quantity: 199, prevQuantity: 0 },
    { name: 'カニパックアレ 100ml', price: 1040, quantity: 168, prevQuantity: 0 },
    { name: 'カニパックLR', price: 3253, quantity: 397, prevQuantity: 0 },
    { name: 'カニパックKR', price: 1670, quantity: 66, prevQuantity: 0 },
    { name: 'キトナコス 27.10', price: 1832.6, quantity: 131, prevQuantity: 156 },
    { name: '缶スタンド', price: 20, quantity: 100, prevQuantity: 0 },
    { name: '斜め刃爪切り', price: 219, quantity: 180, prevQuantity: 191 },
    { name: '除菌ウエットレジカゴバッグ', price: 110, quantity: 69, prevQuantity: 74 },
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
    { name: '共通カニパック 6本箱', company: '当社', price: 78.6, quantity: 0, prevQuantity: 0 },
    { name: '新共通カニパック2021 36本箱', company: '当社', price: 88, quantity: 247, prevQuantity: 0 },
    { name: '中仕切り', company: '当社', price: 5.6, quantity: 4200, prevQuantity: 0 },
  ],
  rawMaterials: [
    { name: 'コーヨーキトサン FH-80<カニ由来>', company: '中日本カプセル', price: 0, quantity: 0.508, prevQuantity: 0.508 },
    { name: '天然にがり', company: 'ウキシマメディカル', price: 0, quantity: 0, prevQuantity: 0 }
  ]
};

// --- Components ---

const QuantityInput = ({ value, onUpdate }) => {
  const [val, setVal] = useState(value);
  useEffect(() => { setVal(value); }, [value]);

  const handleBlur = () => {
    const num = Number(val);
    if (val === '' || isNaN(num) || num < 0) {
      setVal(value);
    } else if (num !== value) {
      onUpdate(num);
    }
  };

  return (
    <input
      type="number"
      inputMode="decimal"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
      className="w-24 px-2 py-1 text-right text-slate-800 font-bold border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
    />
  );
};

const EditableCell = ({ value, type = "text", onUpdate, format }) => {
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
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        autoFocus
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
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false); 
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // CSV読込モーダル用
  const [importText, setImportText] = useState(''); // コピペされたCSVテキスト

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

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const collections = ['products', 'materials', 'rawMaterials'];
    const setters = [setProducts, setMaterials, setRawMaterials];

    const unsubscribes = collections.map((colName, idx) => {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', colName));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sorted = data.sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999) || (a.createdAt || 0) - (b.createdAt || 0));
        setters[idx](sorted);
        
        if (idx === collections.length - 1) setLoading(false);
      }, (err) => console.error(`Fetch error ${colName}:`, err));
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  const updateItem = async (t, id, updates) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', t + 's', id), updates);
  };

  const removeItem = async (t, id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', t + 's', id));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user || !name || !price || !quantity) return;
    const newItem = {
      name, price: Number(price), prevQuantity: 0, quantity: Number(quantity),
      company: (type === 'product' ? '-' : company),
      createdAt: Date.now(), order: Date.now() 
    };

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', type + 's'), newItem);
    setName(''); setPrice(''); setQuantity(''); setIsModalOpen(false);
  };

  // 組み込みデータによる強制上書き機能
  const forceSyncWithVercel = async () => {
    if (!user || initializing) return;
    setInitializing(true);
    try {
      const collections = ['products', 'materials', 'rawMaterials'];
      for (const colName of collections) {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', colName));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }

      const insertBatch = writeBatch(db);
      for (const [key, items] of Object.entries(INITIAL_DATA)) {
        items.forEach((item, index) => {
          const newDoc = doc(collection(db, 'artifacts', appId, 'public', 'data', key));
          insertBatch.set(newDoc, { ...item, order: index, createdAt: Date.now() });
        });
      }
      await insertBatch.commit();
      
      setIsSyncModalOpen(false);
    } catch (err) { console.error("Force Sync error:", err); }
    setInitializing(false);
  };

  // ★ CSVテキストのパース（読込）処理 ★
  const parseCSVText = (text) => {
    const lines = text.split('\n');
    let isDataSection = false;
    const newData = { products: [], materials: [], rawMaterials: [] };

    for (const line of lines) {
      if (!line.trim()) continue;

      // 簡易CSVパースロジック（ダブルクオート対応）
      const row = [];
      let currentVal = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(currentVal);
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      row.push(currentVal);

      const cleanRow = row.map(v => v.trim());

      // 「種類,品名...」のヘッダーを見つけたらデータ行開始
      if (cleanRow[0] === '種類' && cleanRow[1] === '品名') {
        isDataSection = true;
        continue;
      }

      // データ行の読み取り
      if (isDataSection && cleanRow.length >= 6) {
        const typeStr = cleanRow[0];
        if (!['商品', '資材', '原材料'].includes(typeStr)) continue;

        const itemName = cleanRow[1];
        const itemCompany = cleanRow[2] === '-' ? '' : cleanRow[2];
        const itemPrice = Number(cleanRow[3].replace(/,/g, ''));
        const itemPrev = Number(cleanRow[4].replace(/,/g, ''));
        const itemQty = Number(cleanRow[5].replace(/,/g, ''));

        const itemObj = { 
          name: itemName, 
          company: itemCompany, 
          price: isNaN(itemPrice) ? 0 : itemPrice, 
          prevQuantity: isNaN(itemPrev) ? 0 : itemPrev, 
          quantity: isNaN(itemQty) ? 0 : itemQty 
        };

        if (typeStr === '商品') newData.products.push(itemObj);
        else if (typeStr === '資材') newData.materials.push(itemObj);
        else if (typeStr === '原材料') newData.rawMaterials.push(itemObj);
      }
    }
    return newData;
  };

  // ★ コピペされたCSVデータをクラウドに一括反映する処理 ★
  const handleImportCSV = async () => {
    if (!user || initializing || !importText.trim()) return;
    setInitializing(true);
    try {
      const parsedData = parseCSVText(importText);
      
      // データが正しく読み取れたか確認
      if (parsedData.products.length === 0 && parsedData.materials.length === 0 && parsedData.rawMaterials.length === 0) {
        alert("データの読み取りに失敗しました。コピーしたテキストの形式が正しいかご確認ください。");
        setInitializing(false);
        return;
      }

      const collections = ['products', 'materials', 'rawMaterials'];
      
      // 1. クラウドの既存データを全消去
      for (const colName of collections) {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', colName));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }

      // 2. パースしたCSVデータをクラウドに書き込む
      const insertBatch = writeBatch(db);
      for (const [key, items] of Object.entries(parsedData)) {
        items.forEach((item, index) => {
          const newDoc = doc(collection(db, 'artifacts', appId, 'public', 'data', key));
          insertBatch.set(newDoc, { ...item, order: index, createdAt: Date.now() });
        });
      }
      await insertBatch.commit();
      
      setIsImportModalOpen(false);
      setImportText('');
    } catch (err) { 
      console.error("Import CSV error:", err);
      alert("エラーが発生しました。");
    }
    setInitializing(false);
  };

  const handleDrop = async (e, dropIdx, listType) => {
    if (draggedIdx === null || dragType !== listType || draggedIdx === dropIdx) return;
    const list = listType === 'product' ? products : listType === 'material' ? materials : rawMaterials;
    const newList = [...list];
    const [moved] = newList.splice(draggedIdx, 1);
    newList.splice(dropIdx, 0, moved);
    
    for (let i = 0; i < newList.length; i++) {
      if (newList[i].order !== i) await updateItem(listType, newList[i].id, { order: i });
    }
    setDraggedIdx(null);
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
    return {
      products: calc(products),
      materials: calc(materials),
      materialsOur: calcByCo(materials, '当社'),
      materialsExt: materials.filter(m => m.company !== '当社').reduce((sum, i) => sum + (i.price * i.quantity), 0),
      rawMaterials: calc(rawMaterials),
      rawMaterialsOur: calcByCo(rawMaterials, '当社'),
      rawMaterialsExt: rawMaterials.filter(r => r.company !== '当社').reduce((sum, i) => sum + (i.price * i.quantity), 0),
      grandTotal: calc(products) + calc(materials) + calc(rawMaterials)
    };
  }, [products, materials, rawMaterials]);

  const formatCurrency = (v) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(v);

  const exportToCSV = () => {
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;
    const formatNum = (num) => String(num.toLocaleString());
    
    let csvContent = `${escapeCSV(displayMonthInfo.label + " 在庫報告書")}\n`;
    csvContent += `出力日,${escapeCSV(new Date().toLocaleDateString())}\n\n`;
    csvContent += `【サマリー】\n総合計,${escapeCSV(formatNum(totals.grandTotal))}\n商品合計,${escapeCSV(formatNum(totals.products))}\n資材合計,${escapeCSV(formatNum(totals.materials))}\n原材料合計,${escapeCSV(formatNum(totals.rawMaterials))}\n\n`;
    csvContent += "種類,品名,取扱会社,単価,前月数量,今月数量,合計金額\n";
    
    const addRows = (list, label) => list.forEach(i => {
      csvContent += `${escapeCSV(label)},${escapeCSV(i.name)},${escapeCSV(i.company || '-')},${escapeCSV(formatNum(i.price))},${escapeCSV(formatNum(i.prevQuantity))},${escapeCSV(formatNum(i.quantity))},${escapeCSV(formatNum(i.price * i.quantity))}\n`;
    });
    
    addRows(products, "商品");
    addRows(materials, "資材");
    addRows(rawMaterials, "原材料");

    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `${displayMonthInfo.label}_在庫表.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold tracking-widest text-sm uppercase">Loading Canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans relative select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ヘッダー */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{displayMonthInfo.label} 在庫表</h1>
              <div className="flex items-center text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex">
                <Cloud className="w-3 h-3 mr-1" />
                <Check className="w-3 h-3 mr-1" />
                <span>Cloud Multi-User Mode</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* ★ CSV読込（インポート）ボタン ★ */}
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center space-x-1 bg-emerald-500 text-white px-3 py-2 rounded-xl hover:bg-emerald-600 transition-all text-sm font-bold shadow-md shadow-emerald-200 active:scale-95" title="CSVデータをコピペしてクラウドに完全復元します">
              <UploadCloud className="w-4 h-4" />
              <span>CSV読込</span>
            </button>

            {/* 組み込みデータ同期ボタン（予備） */}
            <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center space-x-1 bg-white text-slate-500 px-3 py-2 rounded-xl border border-slate-300 hover:border-amber-300 hover:text-amber-500 transition-all text-sm font-bold shadow-sm active:scale-95" title="システム組み込みの初期データで上書きします">
              <CloudDownload className="w-4 h-4" />
            </button>

            <button onClick={exportToCSV} className="flex items-center space-x-1 bg-white px-3 py-2 rounded-xl border border-slate-300 shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-bold text-slate-600 active:scale-95">
              <Download className="w-4 h-4" />
              <span>CSV出力</span>
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all text-sm font-bold shadow-md shadow-indigo-100 active:scale-95">
              <Plus className="w-4 h-4" />
              <span>新規登録</span>
            </button>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-300 shadow-sm">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input id="target-month" type="month" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} className="outline-none bg-transparent font-black text-indigo-600 cursor-pointer" />
            </div>
          </div>
        </header>

        {/* サマリーパネル */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 flex flex-col justify-between border-b-4 border-indigo-900/20">
            <div className="flex items-center space-x-2 text-indigo-100 mb-2">
              <Wallet className="w-5 h-5" />
              <h2 className="text-lg font-bold">総合計金額</h2>
            </div>
            <p className="text-4xl font-black tracking-tight">{formatCurrency(totals.grandTotal)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center space-x-2 text-slate-500 mb-2">
              <Package className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-700">商品 合計</h2>
            </div>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(totals.products)}</p>
            <div className="mt-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md self-start">{products.length} 品目</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-amber-200 transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2 text-slate-500"><Layers className="w-5 h-5 text-amber-500" /><h2 className="text-lg font-bold text-slate-700">資材 合計</h2></div>
              <p className="text-2xl font-black text-slate-800">{formatCurrency(totals.materials)}</p>
            </div>
            <div className="mt-4 space-y-1 text-[10px] text-slate-400 font-black uppercase tracking-wider border-t border-slate-50 pt-2">
              <div className="flex justify-between"><span className="text-slate-500">自社</span><span className="text-slate-800">{formatCurrency(totals.materialsOur)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">外部協力</span><span className="text-slate-800">{formatCurrency(totals.materialsExt)}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-blue-200 transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2 text-slate-500"><Shapes className="w-5 h-5 text-blue-500" /><h2 className="text-lg font-bold text-slate-700">原材料 合計</h2></div>
              <p className="text-2xl font-black text-slate-800">{formatCurrency(totals.rawMaterials)}</p>
            </div>
            <div className="mt-4 space-y-1 text-[10px] text-slate-400 font-black uppercase tracking-wider border-t border-slate-50 pt-2">
              <div className="flex justify-between"><span className="text-slate-500">自社</span><span className="text-slate-800">{formatCurrency(totals.rawMaterialsOur)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">外部協力</span><span className="text-slate-800">{formatCurrency(totals.rawMaterialsExt)}</span></div>
            </div>
          </div>
        </div>

        {/* リスト表示 */}
        <div className="space-y-8 pb-32">
          {[
            { title: '商品', list: products, type: 'product', color: 'emerald' },
            { title: '資材', list: materials, type: 'material', color: 'amber' },
            { title: '原材料', list: rawMaterials, type: 'rawMaterial', color: 'blue' }
          ].map(section => (
            <div key={section.title} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className={`bg-${section.color}-50/50 px-8 py-5 border-b border-${section.color}-100 flex items-center justify-between`}>
                <h3 className={`font-black text-${section.color}-800 flex items-center text-lg`}>
                  {section.type === 'product' ? <Package className="w-6 h-6 mr-3" /> : section.type === 'material' ? <Layers className="w-6 h-6 mr-3" /> : <Shapes className="w-6 h-6 mr-3" />}
                  {section.title}リスト
                </h3>
                <div className={`text-${section.color}-800 font-black bg-white px-4 py-1.5 rounded-xl shadow-sm border border-${section.color}-100`}>
                  {formatCurrency(totals[section.type + 's'] || totals[section.type])}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="px-4 py-5 w-12 text-center">#</th>
                      <th className="px-4 py-5 font-bold">品名</th>
                      {section.type !== 'product' && <th className="px-4 py-5 font-bold text-center">取扱会社</th>}
                      <th className="px-6 py-5 font-bold text-right">数量推移 (前月 ➔ 今月)</th>
                      <th className="px-6 py-5 font-bold text-right">単価</th>
                      <th className="px-6 py-5 font-bold text-right">合計金額</th>
                      <th className="px-6 py-5 font-bold text-center w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {section.list.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center text-slate-300 font-bold italic tracking-widest">
                          データがありません。右上の「CSV読込」ボタンからご自身のデータを復元してください。
                        </td>
                      </tr>
                    ) : (
                      section.list.map((item, idx) => (
                        <tr 
                          key={item.id} 
                          draggable
                          onDragStart={() => { setDraggedIdx(idx); setDragType(section.type); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, idx, section.type)}
                          className={`hover:bg-slate-50/80 transition-all duration-200 group ${draggedIdx === idx && dragType === section.type ? 'opacity-30' : ''}`}
                        >
                          <td className="px-4 py-4 text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-600 transition-colors">
                            <GripVertical className="w-5 h-5 mx-auto" />
                          </td>
                          <td className="px-4 py-4 text-slate-700 font-black min-w-[240px]">
                            <EditableCell value={item.name} onUpdate={(n) => updateItem(section.type, item.id, { name: n })} />
                          </td>
                          {section.type !== 'product' && (
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tight ${item.company === '当社' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                {item.company}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4 text-right flex items-center justify-end whitespace-nowrap">
                            <span className="text-slate-400 text-xs mr-3 font-mono font-bold">{item.prevQuantity.toLocaleString()}</span>
                            <span className="mx-2 text-slate-200 font-black">➔</span>
                            <QuantityInput value={item.quantity} onUpdate={(q) => updateItem(section.type, item.id, { prevQuantity: item.quantity, quantity: q })} />
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-500">
                            <EditableCell value={item.price} type="number" format={formatCurrency} onUpdate={(p) => updateItem(section.type, item.id, { price: p })} />
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => removeItem(section.type, item.id)} className="text-slate-300 hover:text-red-500 transition-all p-2 rounded-xl hover:bg-red-50 active:scale-90"><Trash2 className="w-5 h-5" /></button>
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

      {/* ★ CSVインポート（読込）用モーダル ★ */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border-2 border-emerald-500 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center">
                <UploadCloud className="w-8 h-8 mr-3 text-emerald-500" />
                <h3 className="text-xl font-black text-slate-800">CSVデータを読み込む</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="mb-4">
                <p className="text-slate-600 font-bold leading-relaxed mb-2">
                  Vercelのアプリからダウンロードした<span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mx-1">在庫表.csv</span>をテキストエディタ（メモ帳など）で開き、<br/>
                  中身の文字をすべて下の枠内に貼り付けてください。
                </p>
                <p className="text-xs text-amber-600 font-bold flex items-center bg-amber-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  読み込むと現在のクラウドデータはすべて上書きされます。
                </p>
              </div>
              
              <textarea 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`【ここに貼り付け】\n例:\n"商品","カニパック","-","1,165.3","0","243","283,167.9"\n...`}
                className="w-full h-64 p-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-mono text-sm text-slate-700 bg-slate-50/50"
              />
              
              <button 
                onClick={handleImportCSV} 
                className="w-full py-4 px-6 mt-6 rounded-2xl text-white font-black bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] flex justify-center items-center"
                disabled={initializing || !importText.trim()}
              >
                {initializing ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'データを一括同期する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 組み込みデータ強制同期モーダル（予備） */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300 border-2 border-amber-500">
            <div className="px-8 py-6 border-b border-amber-100 flex items-center bg-amber-50/50">
              <AlertTriangle className="w-8 h-8 mr-3 text-amber-500" />
              <h3 className="text-xl font-black text-slate-800">システム初期データで上書きします</h3>
            </div>
            <div className="p-8">
              <p className="text-slate-600 font-bold leading-relaxed mb-6">
                キャンバスに残っているデータを消去し、システムに組み込まれた仮のデータで上書きします。よろしいですか？
              </p>
              <div className="flex space-x-4">
                <button onClick={() => setIsSyncModalOpen(false)} className="flex-1 py-4 px-6 rounded-2xl text-slate-600 font-black bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]" disabled={initializing}>キャンセル</button>
                <button onClick={forceSyncWithVercel} className="flex-1 py-4 px-6 rounded-2xl text-white font-black bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-200 transition-all active:scale-[0.98] flex justify-center items-center" disabled={initializing}>
                  {initializing ? <RefreshCw className="w-6 h-6 animate-spin" /> : '上書きする'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規登録モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 flex items-center"><Plus className="w-6 h-6 mr-2 text-indigo-500" />新規登録</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8">
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                  {['product', 'material', 'rawMaterial'].map(t => (
                    <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${type === t ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                      {t === 'product' ? '商品' : t === 'material' ? '資材' : '原材料'}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2 tracking-widest uppercase">品名</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-slate-50/50 transition-all font-bold" placeholder="名称を入力" />
                </div>
                {type !== 'product' && (
                  <div>
                    <label className="block text-xs font-black text-slate-400 mb-2 tracking-widest uppercase">取扱会社</label>
                    <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-slate-50/50 appearance-none font-bold">
                      <option value="当社">当社</option>
                      <option value="ウキシマメディカル">ウキシマメディカル</option>
                      <option value="中日本カプセル">中日本カプセル</option>
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 mb-2 tracking-widest uppercase">単価 (円)</label>
                    <input type="number" required min="0" step="any" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-slate-50/50 transition-all font-bold" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 mb-2 tracking-widest uppercase">初期数量</label>
                    <input type="number" required min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-slate-50/50 transition-all font-bold" placeholder="0" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 px-6 rounded-2xl text-white font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 mt-4 transition-all active:scale-[0.98]">リストに追加する</button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* ユーザーID/ステータス */}
      <footer className="fixed bottom-6 right-6 z-40 pointer-events-none">
        <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700/50 backdrop-blur-md bg-opacity-90">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black tracking-widest uppercase opacity-70">Logged in:</span>
          <span className="text-[10px] font-mono font-bold truncate max-w-[120px]">{user?.uid}</span>
        </div>
      </footer>
    </div>
  );
}
