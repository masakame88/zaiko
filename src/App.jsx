import React, { useState, useMemo, useEffect, memo } from 'react';
import { 
  Package, Layers, Plus, Trash2, Wallet, 
  Briefcase, Calendar, Shapes, Edit2, Download, X, 
  GripVertical, Cloud, Check, RefreshCw, AlertCircle,
  Upload, RotateCcw, AlertTriangle, AlertOctagon
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
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

// あなたのFirebase設定
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
  // （Canvas環境のドメインエラーを防ぐため）
  if (typeof window !== 'undefined' && window.__firebase_config) {
    const firebaseConfig = JSON.parse(window.__firebase_config);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = window.__app_id || appId;
    isEnvConfigured = true;
    isCanvasEnv = true;
  } 
  // 2. Vercelなどの本番環境用
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

// データベースのパスを環境に応じて切り替えるユーティリティ
const getBasePath = (t) => isCanvasEnv 
  ? collection(db, 'artifacts', appId, 'public', 'data', t)
  : collection(db, 'shared_inventory', 'latest', t);

const getDocPath = (t, id) => isCanvasEnv 
  ? doc(db, 'artifacts', appId, 'public', 'data', t, id)
  : doc(db, 'shared_inventory', 'latest', t, id);

// --- 最後にいただいたCSVの全データを完全に描き込んだ「初期データ」 ---
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

// --- 子コンポーネントのメモ化（再描画の抑制） ---

const QuantityInput = memo(({ value, onUpdate }) => {
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
});

// --- Main App ---

export default function App() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState({ products: [], materials: [], rawMaterials: [] });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting to Database...');

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

  // ファイルを画面にドラッグしているかを判定する状態
  const [isDragOverDocument, setIsDragOverDocument] = useState(false);

  // ウィンドウ全体でのファイルドラッグを検知する
  useEffect(() => {
    const handleWindowDragOver = (e) => {
      e.preventDefault();
      // ファイルのドラッグである場合のみ反応する
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
        setIsDragOverDocument(true);
      }
    };
    window.addEventListener("dragover", handleWindowDragOver);
    return () => window.removeEventListener("dragover", handleWindowDragOver);
  }, []);

  // Auth Listener
  useEffect(() => {
    if (!isEnvConfigured) {
      setConnectionStatus("設定情報が見つかりません");
      setLoading(false);
      return;
    }
    const initAuth = async () => {
      try {
        setConnectionStatus("認証プロセスを開始...");
        if (isCanvasEnv && window.__initial_auth_token) {
          // Canvasプレビュー用認証
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          // Vercel本番用匿名認証
          await signInAnonymously(auth);
        }
        setConnectionStatus("認証完了。データを取得中...");
      } catch (err) { 
        console.error("Auth error:", err); 
        let errorMsg = `認証エラー: ${err.message || err.code}`;
        if (err.code === 'auth/operation-not-allowed') {
          errorMsg = "【重要】Firebaseで「匿名認証（Anonymous）」が有効になっていません。\nFirebase Console > Authentication > Sign-in method で設定してください。";
        } else if (err.code === 'auth/configuration-not-found') {
             errorMsg = "Firebaseのプロジェクト設定が見つかりません。設定情報（YOUR_FIREBASE_CONFIG）が正しいか確認してください。";
        }
        setErrorMessage(errorMsg);
        setConnectionStatus("認証に失敗しました");
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Data Sync Listener
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
        console.error(`Fetch error ${colName}:`, err);
        let errorMsg = `データ取得エラー (${colName}): ${err.message || err.code}`;
        if (err.code === 'permission-denied') {
          errorMsg = "【重要】Firestoreのアクセス権限がありません。\nFirebase Console > Firestore Database > ルールタブ で、「allow read, write: if true;」に変更してください。";
        }
        setErrorMessage(errorMsg);
        setConnectionStatus("データ取得に失敗しました");
      });
    });

    return () => unsubs.forEach(u => u());
  }, [user]);

  const updateItem = async (t, id, updates) => {
    if (!user || !isEnvConfigured) return;
    await updateDoc(getDocPath(t + 's', id), updates);
  };

  const removeItem = async (t, id) => {
    if (!user || !isEnvConfigured) return;
    await deleteDoc(getDocPath(t + 's', id));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user || !name || !price || !quantity || !isEnvConfigured) return;
    const newItem = {
      name, price: Number(price), prevQuantity: 0, quantity: Number(quantity),
      company: (type === 'product' ? '-' : company),
      createdAt: Date.now(), order: Date.now() 
    };
    
    await addDoc(getBasePath(type + 's'), newItem);
    setName(''); setPrice(''); setQuantity(''); setIsModalOpen(false);
  };

  const restoreInitialData = async () => {
    if (!user || initializing || !isEnvConfigured) return;
    setInitializing(true);
    try {
      const collections = ['products', 'materials', 'rawMaterials'];
      const batch = writeBatch(db);

      for (const colName of collections) {
        const colRef = getBasePath(colName);
        const snapshot = await getDocs(query(colRef));
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        
        INITIAL_DATA[colName].forEach((item, index) => {
          const newDoc = doc(colRef);
          batch.set(newDoc, { ...item, order: index, createdAt: Date.now() });
        });
      }
      await batch.commit();
      setIsSyncModalOpen(false);
    } catch (err) { 
      console.error("Restore error:", err); 
      setErrorMessage(`復元エラー: ${err.message}`);
    }
    setInitializing(false);
  };

  // --- 読み込み精度を極限まで高めたデータパーサー（テキストから読み解く） ---
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
        
        // エクセルからのコピー（タブ区切り）か、CSV（カンマ区切り）かを自動判定
        const separator = line.includes('\t') ? '\t' : ',';
        
        const row = [];
        let currentVal = '';
        let inQuotes = false;
        
        // 1文字ずつ精密に読み取る
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === separator && !inQuotes) {
            row.push(currentVal.trim());
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        row.push(currentVal.trim());
        const clean = row;

        const mapping = { '商品': 'products', '資材': 'materials', '原材料': 'rawMaterials' };
        // ゴミ文字を徹底的に除外して種類を特定
        const typeStr = clean[0] ? clean[0].replace(/['"]/g, '').trim() : '';
        const key = mapping[typeStr];
        
        if (key && clean.length >= 6) {
          parsedData[key].push({
            name: clean[1] ? clean[1].replace(/['"]/g, '').trim() : '', 
            company: (clean[2] === '-' || clean[2] === '"-"') ? '' : (clean[2] || '').replace(/['"]/g, '').trim(), 
            // 単価や数量に含まれるカンマ（,）や円マークを安全に取り除いて数値化
            price: Number((clean[3] || '0').replace(/[,¥"']/g, '')),
            prevQuantity: Number((clean[4] || '0').replace(/[,¥"']/g, '')), 
            quantity: Number((clean[5] || '0').replace(/[,¥"']/g, '')),
          });
          importCount++;
        }
      }

      if (importCount === 0) {
        throw new Error("有効なデータが見つかりませんでした。\n「種類（商品/資材/原材料）」が含まれるデータ行が存在するかご確認ください。");
      }

      // --- 完璧にパースできた場合のみ、古いデータを消去して新しいデータを流し込む ---
      for (const colName of ['products', 'materials', 'rawMaterials']) {
        const colRef = getBasePath(colName);
        const snap = await getDocs(query(colRef));
        snap.docs.forEach(d => batch.delete(d.ref)); // 古い器をクリア

        parsedData[colName].forEach((item, index) => {
          batch.set(doc(colRef), {
            ...item,
            createdAt: Date.now() + index, // 並び順を保証
            order: Date.now() + index
          });
        });
      }

      await batch.commit();
      setIsImportModalOpen(false);
      setImportText('');
    } catch (err) { 
      console.error("CSV Import Error:", err);
      setErrorMessage(`読み込みエラー:\n${err.message}`);
    }
    setInitializing(false);
  };

  const handleImportCSV = async () => {
    await processImportText(importText);
  };

  const handleDrop = async (e, dropIdx, listType) => {
    if (draggedIdx === null || dragType !== listType || draggedIdx === dropIdx || !isEnvConfigured) return;
    const list = [...inventory[listType + 's']];
    const [moved] = list.splice(draggedIdx, 1);
    list.splice(dropIdx, 0, moved);
    
    for (let i = 0; i < list.length; i++) {
      if (list[i].order !== i) await updateItem(listType, list[i].id, { order: i });
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
    const p = inventory.products, m = inventory.materials, r = inventory.rawMaterials;
    return {
      products: calc(p), materials: calc(m), materialsOur: calcByCo(m, '当社'),
      materialsExt: m.filter(i => i.company !== '当社').reduce((sum, i) => sum + (i.price * i.quantity), 0),
      rawMaterials: calc(r), rawMaterialsOur: calcByCo(r, '当社'),
      rawMaterialsExt: r.filter(i => i.company !== '当社').reduce((sum, i) => sum + (i.price * i.quantity), 0),
      grandTotal: calc(p) + calc(m) + calc(r)
    };
  }, [inventory]);

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
    
    addRows(inventory.products, "商品");
    addRows(inventory.materials, "資材");
    addRows(inventory.rawMaterials, "原材料");

    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `${displayMonthInfo.label}_在庫表.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isEnvConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-center">
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 max-w-xl animate-in fade-in zoom-in duration-500">
          <Check className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-6">デプロイ成功</h2>
          <div className="text-slate-600 font-bold leading-relaxed mb-6 text-left space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p>Vercelへの構築は無事に完了しました。しかし、命を吹き込むための「鍵」がまだ正しく認識されていないようです。</p>
            <p className="text-sm text-indigo-700 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
              <strong>App.jsxの25行目付近（YOUR_FIREBASE_CONFIG）</strong>に、Firebaseで取得した設定をコピーして貼り付け、再度GitHubへ保存してください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // エラーが発生している場合はエラーメッセージを表示しつつ、Loading画面を維持（またはエラー画面に切り替え）
  if (loading || errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        {errorMessage ? (
           <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-8 max-w-2xl w-full text-center shadow-xl">
             <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
             <h3 className="text-xl font-black text-slate-800 mb-4">接続エラー</h3>
             <p className="text-slate-700 font-bold whitespace-pre-wrap text-left bg-white p-4 rounded-xl border border-red-200">
               {errorMessage}
             </p>
             <p className="mt-6 text-sm text-slate-500">
                上記のエラー内容をご確認いただき、Firebaseの設定または入力データをご確認ください。
             </p>
           </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-400 font-black tracking-widest text-xs uppercase">{connectionStatus}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans relative select-none transition-opacity duration-500">
      
      {/* --- CSVファイル ドラッグ＆ドロップ用 全画面オーバーレイ --- */}
      {isDragOverDocument && (
        <div 
          className="fixed inset-0 bg-indigo-900/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center border-8 border-indigo-500 border-dashed transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragOverDocument(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOverDocument(false);
            const file = e.dataTransfer.files[0];
            if (file) {
              const reader = new FileReader();
              // ファイルの中身を読み取り、先ほど精密化したパーサーへ直接渡す
              reader.onload = (event) => processImportText(event.target.result);
              // 万が一文字化けする場合は、従来通りのコピペをご利用ください
              reader.readAsText(file); 
            }
          }}
        >
          <div className="bg-white/10 p-12 rounded-full mb-8 animate-pulse shadow-2xl">
            <Upload className="w-24 h-24 text-indigo-200" />
          </div>
          <h2 className="text-5xl font-black text-white tracking-widest mb-6 drop-shadow-lg">CSVファイルをドロップ</h2>
          <p className="text-indigo-200 font-bold text-xl drop-shadow">ここにファイルを離すと、自動で読み込みを開始します</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{displayMonthInfo.label} 在庫表</h1>
              <div className="flex items-center text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex">
                <Cloud className="w-3 h-3 mr-1" />
                <span>Cloud Sync Live</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center space-x-1 bg-white text-emerald-600 px-3 py-2 rounded-xl border border-slate-300 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-sm font-bold shadow-sm active:scale-95">
              <Upload className="w-4 h-4" /><span>CSV読込</span>
            </button>
            <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center space-x-1 bg-white text-slate-600 px-3 py-2 rounded-xl border border-slate-300 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all text-sm font-bold shadow-sm active:scale-95">
              <RotateCcw className="w-4 h-4" /><span>初期データ復元</span>
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all text-sm font-bold shadow-md shadow-indigo-100 active:scale-95">
              <Plus className="w-4 h-4" /><span>新規登録</span>
            </button>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-300 shadow-sm">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input type="month" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} className="outline-none bg-transparent font-black text-indigo-600 cursor-pointer" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 border-b-4 border-indigo-900/20">
            <div className="flex items-center space-x-2 text-indigo-100 mb-2"><Wallet className="w-5 h-5" /><h2 className="text-lg font-bold">総合計金額</h2></div>
            <p className="text-4xl font-black tracking-tight">{formatCurrency(totals.grandTotal)}</p>
          </div>
          {[
            { label: '商品', val: totals.products, icon: Package, col: 'emerald', count: inventory.products.length },
            { label: '資材', val: totals.materials, icon: Layers, col: 'amber', sub: [{ l: '自社', v: totals.materialsOur }, { l: '外部', v: totals.materialsExt }] },
            { label: '原材料', val: totals.rawMaterials, icon: Shapes, col: 'blue', sub: [{ l: '自社', v: totals.rawMaterialsOur }, { l: '外部', v: totals.rawMaterialsExt }] }
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2"><s.icon className={`w-5 h-5 text-${s.col}-500`} /><h2 className="text-lg font-bold text-slate-700">{s.label} 合計</h2></div>
                <p className="text-2xl font-black text-slate-800">{formatCurrency(s.val)}</p>
              </div>
              {s.count !== undefined && <div className={`text-[10px] font-black text-${s.col}-600 bg-${s.col}-50 px-2 py-0.5 rounded-md self-start inline-block`}>{s.count} 品目</div>}
              {s.sub && (
                <div className="mt-4 space-y-1 text-[10px] text-slate-400 font-black uppercase tracking-wider border-t border-slate-50 pt-2">
                  {s.sub.map(item => <div key={item.l} className="flex justify-between"><span>{item.l}</span><span className="text-slate-800">{formatCurrency(item.v)}</span></div>)}
                </div>
              )}
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
                <h3 className={`font-black text-${section.color}-800 flex items-center text-lg`}>{section.title}リスト</h3>
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
                      <th className="px-6 py-5 text-right">合計金額</th>
                      <th className="px-6 py-5 text-center w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {section.list.length === 0 ? (
                      <tr><td colSpan="7" className="px-6 py-16 text-center text-slate-300 font-bold">データがありません。</td></tr>
                    ) : (
                      section.list.map((item, idx) => (
                        <tr 
                          key={item.id} 
                          draggable 
                          onDragStart={() => { setDraggedIdx(idx); setDragType(section.type); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, idx, section.type)}
                          className={`hover:bg-slate-50/80 transition-colors group ${draggedIdx === idx && dragType === section.type ? 'opacity-30' : ''}`}
                        >
                          <td className="px-4 py-4 text-slate-300 cursor-grab active:cursor-grabbing"><GripVertical className="w-5 h-5 mx-auto" /></td>
                          <td className="px-4 py-4 font-black min-w-[240px]">
                            <EditableCell value={item.name} onUpdate={(n) => updateItem(section.type, item.id, { name: n })} />
                          </td>
                          {section.type !== 'product' && (
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2 py-1 rounded text-[10px] font-black ${item.company === '当社' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{item.company}</span>
                            </td>
                          )}
                          <td className="px-6 py-4 text-right flex items-center justify-end">
                            <span className="text-slate-400 text-xs mr-3 font-mono">{item.prevQuantity.toLocaleString()}</span>
                            <span className="mx-2 text-slate-200">➔</span>
                            <QuantityInput value={item.quantity} onUpdate={(q) => updateItem(section.type, item.id, { prevQuantity: item.quantity, quantity: q })} />
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-500">
                            <EditableCell value={item.price} type="number" format={formatCurrency} onUpdate={(p) => updateItem(section.type, item.id, { price: p })} />
                          </td>
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

      {/* エラー表示モーダル */}
      {errorMessage && !loading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-sm overflow-hidden border-2 border-red-500">
            <div className="px-6 py-4 border-b border-red-100 flex items-center bg-red-50/50"><AlertCircle className="w-6 h-6 mr-3 text-red-500" /><h3 className="text-lg font-black">エラー</h3></div>
            <div className="p-6">
              <p className="text-slate-600 font-bold mb-6 whitespace-pre-wrap">{errorMessage}</p>
              <button onClick={() => setErrorMessage('')} className="w-full py-4 px-6 rounded-2xl text-white font-black bg-red-500 hover:bg-red-600 shadow-xl transition-all">閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* CSVインポートモーダル (手動入力用) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border-2 border-emerald-500 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center"><Upload className="w-8 h-8 mr-3 text-emerald-500" /><h3 className="text-xl font-black">CSVデータを読み込む</h3></div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="mb-4">
                <p className="text-slate-600 font-bold leading-relaxed mb-2">
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mx-1">画面に直接ファイルをドラッグ＆ドロップ</span>するか、<br/>
                  以下の枠内にExcelの表をコピーして貼り付けてください。
                </p>
                <p className="text-xs text-amber-600 font-bold flex items-center bg-amber-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  読み込むと現在のクラウドデータはすべて上書きされます。
                </p>
              </div>
              <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={`種類\t品名\t取扱会社\t単価\t前月数量\t今月数量\n商品\tカニパック\t-\t1,165.3\t0\t243\n...`} className="w-full h-64 p-4 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 outline-none font-mono text-sm bg-slate-50/50" />
              <button onClick={handleImportCSV} className="w-full py-4 px-6 mt-6 rounded-2xl text-white font-black bg-emerald-500 hover:bg-emerald-600 shadow-xl transition-all" disabled={initializing}>
                {initializing ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'データを一括同期する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 復元モーダル */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-amber-500">
            <div className="px-8 py-6 border-b border-amber-100 flex items-center bg-amber-50/50"><AlertTriangle className="w-8 h-8 mr-3 text-amber-500" /><h3 className="text-xl font-black">初期データを復元</h3></div>
            <div className="p-8">
              <p className="text-slate-600 font-bold leading-relaxed mb-6">現在クラウドにある全データを消去し、<br/><span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">最後にいただいたCSVデータ</span><br/>を再配置します。よろしいですか？</p>
              <div className="flex space-x-4">
                <button onClick={() => setIsSyncModalOpen(false)} className="flex-1 py-4 px-6 rounded-2xl text-slate-600 font-black bg-slate-100 hover:bg-slate-200 transition-all">キャンセル</button>
                <button onClick={restoreInitialData} className="flex-1 py-4 px-6 rounded-2xl text-white font-black bg-amber-500 hover:bg-amber-600 shadow-xl transition-all" disabled={initializing}>
                  {initializing ? <RefreshCw className="w-6 h-6 animate-spin" /> : '復元する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規登録モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 flex items-center"><Plus className="w-6 h-6 mr-2 text-indigo-500" />新規登録</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X className="w-6 h-6" /></button>
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
      
      <footer className="fixed bottom-6 right-6 z-40 pointer-events-none">
        <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700/50 backdrop-blur-md bg-opacity-90">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black uppercase opacity-70">Cloud UID:</span>
          <span className="text-[10px] font-mono font-bold truncate max-w-[120px]">{user?.uid}</span>
        </div>
      </footer>
    </div>
  );
}
