import React, { useState, useMemo, useEffect, memo } from 'react';
import { 
  Package, Layers, Plus, Trash2, Wallet, 
  Briefcase, Calendar, Shapes, Edit2, Download, X, 
  GripVertical, Cloud, Check, RefreshCw, AlertCircle,
  Upload, RotateCcw, AlertTriangle, Save, LogOut,
  ArrowRight, Minus, Truck, ShoppingCart
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
  if (typeof window !== 'undefined' && window.__firebase_config) {
    const firebaseConfig = JSON.parse(window.__firebase_config);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = window.__app_id || appId;
    isEnvConfigured = true;
    isCanvasEnv = true;
  } else if (YOUR_FIREBASE_CONFIG && YOUR_FIREBASE_CONFIG.apiKey) {
    app = initializeApp(YOUR_FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    isEnvConfigured = true;
    isCanvasEnv = false;
  }
} catch (e) {
  console.warn("Firebase configuration check:", e);
}

const getBasePath = (t) => isCanvasEnv 
  ? collection(db, 'artifacts', appId, 'public', 'data', t) 
  : collection(db, 'inventory', 'master', t);

const getDocPath = (t, id) => isCanvasEnv 
  ? doc(db, 'artifacts', appId, 'public', 'data', t, id)
  : doc(db, 'inventory', 'master', t, id);

// --- 初期データ ---
const INITIAL_DATA = {
  products: [
    { name: 'KP88携帯用', price: 267.3, prevQuantity: 0, quantity: 1000, monthlyPace: 86, orders: [] },
    { name: 'カニパック', price: 1165.3, prevQuantity: 0, quantity: 400, monthlyPace: 55, orders: [] },
    { name: 'カニパック８８', price: 1211.5, prevQuantity: 0, quantity: 2000, monthlyPace: 273, orders: [] },
    { name: 'カニパック９０', price: 982.8, prevQuantity: 0, quantity: 600, monthlyPace: 76, orders: [] },
    { name: 'KPKP280粒', price: 1345.1, prevQuantity: 0, quantity: 200, monthlyPace: 25, orders: [] },
    { name: 'KPKP 21-S', price: 1437, prevQuantity: 0, quantity: 20, monthlyPace: 3, orders: [] },
    { name: 'KPKP 21-H', price: 993.1, prevQuantity: 0, quantity: 150, monthlyPace: 17, orders: [] },
    { name: 'カニパックス-A 60g', price: 1290, prevQuantity: 0, quantity: 100, monthlyPace: 20, orders: [] },
    { name: 'カニパックアレ', price: 1040, prevQuantity: 0, quantity: 50, monthlyPace: 8, orders: [] },
    { name: 'KPLR210粒', price: 3253, prevQuantity: 0, quantity: 300, monthlyPace: 46, orders: [] },
    { name: 'キトナコス', price: 1832.6, prevQuantity: 0, quantity: 100, monthlyPace: 15, orders: [] }
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
      className="w-20 px-2 py-1 text-right text-slate-800 font-bold border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm transition-all"
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
  const [historyLogs, setHistoryLogs] = useState([]); // ★ 履歴保存用のステート
  
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting to Database...');
  const [toastMessage, setToastMessage] = useState(''); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false); 
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // 出庫・入庫モーダル
  const [adjustModal, setAdjustModal] = useState({ isOpen: false, item: null, type: '', action: '', amount: '' });
  
  // 発注記録モーダル
  const [orderModal, setOrderModal] = useState({ isOpen: false, item: null, amount: '', date: '' });

  const [type, setType] = useState('product');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [monthlyPace, setMonthlyPace] = useState('');
  const [company, setCompany] = useState('当社');
  const [targetMonth, setTargetMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragType, setDragType] = useState(null);
  const [isDragOverDocument, setIsDragOverDocument] = useState(false);
  const [draggableRowId, setDraggableRowId] = useState(null);

  const [orderAlertInfo, setOrderAlertInfo] = useState({ isAlertDay: false, message: '' });

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

  // Auth & Holiday Fetch
  useEffect(() => {
    if (!isEnvConfigured) { setLoading(false); return; }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) { setLoading(false); }
    });

    const initAuth = async () => {
      try {
        setConnectionStatus("認証プロセスを開始...");
        if (isCanvasEnv && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        }
      } catch (err) { 
        console.error("Auth error:", err); 
        setErrorMessage(`認証エラー: ${err.message || err.code}`);
        setLoading(false);
      }
    };
    initAuth();

    fetch('https://holidays-jp.github.io/api/v1/date.json')
      .then(res => res.json())
      .then(holidays => {
        const todayObj = new Date();
        const yyyy = todayObj.getFullYear();
        const month = todayObj.getMonth();
        
        const checkIsHoliday = (d) => {
          if (d.getDay() === 0 || d.getDay() === 6) return true;
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return holidays[dateStr] !== undefined;
        };

        const getNextBusinessDay = (targetDate) => {
          let d = new Date(yyyy, month, targetDate);
          while (checkIsHoliday(d)) {
            d.setDate(d.getDate() + 1);
          }
          return d.getDate();
        };

        const orderDay1 = getNextBusinessDay(1);
        const orderDay15 = getNextBusinessDay(15);
        const todayDate = todayObj.getDate();
        
        if (todayDate === orderDay1) {
          setOrderAlertInfo({
            isAlertDay: true,
            message: `今日は月初（1日）の発注確認日です。${orderDay1 !== 1 ? `\n※1日が休日のため、休み明けの本日（${orderDay1}日）に繰り越されました。` : ''}`
          });
        } else if (todayDate === orderDay15) {
          setOrderAlertInfo({
            isAlertDay: true,
            message: `今日は中旬（15日）の発注確認日です。${orderDay15 !== 15 ? `\n※15日が休日のため、休み明けの本日（${orderDay15}日）に繰り越されました。` : ''}`
          });
        } else {
          setOrderAlertInfo({ isAlertDay: false, message: '' });
        }
      })
      .catch(err => {
        const todayDate = new Date().getDate();
        if (todayDate === 1 || todayDate === 15) {
          setOrderAlertInfo({ isAlertDay: true, message: `今日は発注確認日です（${todayDate}日）。` });
        }
      });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (err) {
      setLoginError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setInventory({ products: [], materials: [], rawMaterials: [] });
  };

  // Data & History Listeners
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

    // ★ 履歴データのリスナーを追加
    const unsubHistory = onSnapshot(query(getBasePath('history')), (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoryLogs(logs);
    }, (err) => console.error("履歴取得エラー:", err));

    return () => {
      unsubs.forEach(u => u());
      unsubHistory();
    };
  }, [user]);

  // ★ 過去30日間の出庫履歴から「月間平均出荷数」を自動算出
  const autoMonthlyPaces = useMemo(() => {
    const paces = {};
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // 商品の「出庫（sub）」履歴のみを抽出
    const recentSubs = historyLogs.filter(log => 
      log.type === 'product' && log.action === 'sub' && log.timestamp >= thirtyDaysAgo
    );
    
    // アイテムごとに30日間の合計出庫数を計算
    recentSubs.forEach(log => {
      if (!paces[log.itemId]) paces[log.itemId] = 0;
      paces[log.itemId] += log.amount;
    });
    
    return paces;
  }, [historyLogs]);

  const updateItem = async (t, id, updates) => {
    if (!user || !isEnvConfigured) return;
    try { await updateDoc(getDocPath(t + 's', id), updates); } 
    catch (err) { setErrorMessage(`更新エラー: ${err.message}`); }
  };

  const removeItem = async (t, id) => {
    if (!user || !isEnvConfigured) return;
    try {
      await deleteDoc(getDocPath(t + 's', id));
      showToast("データを削除しました");
    } catch (err) { setErrorMessage(`削除エラー: ${err.message}`); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user || !name || !price || !quantity || !isEnvConfigured) return;
    const newItem = {
      name, price: Number(price), prevQuantity: 0, quantity: Number(quantity),
      monthlyPace: type === 'product' ? Number(monthlyPace || 0) : 0,
      company: (type === 'product' ? '-' : company),
      createdAt: Date.now(), order: Date.now(),
      orders: [] 
    };
    try {
      await addDoc(getBasePath(type + 's'), newItem);
      setName(''); setPrice(''); setQuantity(''); setMonthlyPace(''); setIsModalOpen(false);
      showToast("新規データを追加しました");
    } catch (err) { setErrorMessage(`追加エラー: ${err.message}`); }
  };

  // ★ 履歴をデータベースに保存する関数
  const addHistoryLog = async (item, type, action, amount, newQuantity) => {
    if (!user || !isEnvConfigured) return;
    try {
      const logItem = {
        itemId: item.id,
        itemName: item.name,
        type: type,          // 'product', 'material', 'rawMaterial'
        action: action,      // 'add' (入庫), 'sub' (出庫)
        amount: Number(amount),
        newQuantity: Number(newQuantity),
        timestamp: Date.now(),
        dateString: new Date().toLocaleDateString()
      };
      await addDoc(getBasePath('history'), logItem);
    } catch (error) {
      console.error("履歴保存エラー:", error);
    }
  };

  // 出入庫の実行
  const executeAdjustment = async (e) => {
    e.preventDefault();
    if (!user || !adjustModal.item || !adjustModal.amount || !isEnvConfigured) return;
    
    const amount = Number(adjustModal.amount);
    let newQuantity = adjustModal.item.quantity;
    
    if (adjustModal.action === 'sub') { newQuantity = Math.max(0, newQuantity - amount); } 
    else if (adjustModal.action === 'add') { newQuantity = newQuantity + amount; }

    try {
      const updates = { prevQuantity: adjustModal.item.quantity, quantity: newQuantity };
      
      // 1. 在庫の更新
      await updateDoc(getDocPath(adjustModal.type + 's', adjustModal.item.id), updates);
      
      // 2. ★ 裏側で操作履歴（トランザクション）を記録
      await addHistoryLog(adjustModal.item, adjustModal.type, adjustModal.action, amount, newQuantity);

      setAdjustModal({ isOpen: false, item: null, type: '', action: '', amount: '' });
      showToast(`${adjustModal.action === 'add' ? '入庫' : '出庫'}処理が完了し、履歴に記録されました`);
    } catch (err) { setErrorMessage(`処理エラー: ${err.message}`); }
  };

  // 複数回の発注記録を保存
  const executeOrderRecord = async (e) => {
    e.preventDefault();
    if (!user || !orderModal.item || !orderModal.amount || !orderModal.date || !isEnvConfigured) return;
    
    try {
      let currentOrders = orderModal.item.orders || [];
      if (currentOrders.length === 0 && orderModal.item.isOrdered) {
        currentOrders = [{ id: 'legacy', amount: orderModal.item.orderedQuantity, date: orderModal.item.arrivalDate }];
      }

      const newOrder = { id: Date.now().toString(), amount: Number(orderModal.amount), date: orderModal.date };
      const updatedOrders = [...currentOrders, newOrder].sort((a, b) => new Date(a.date) - new Date(b.date));

      await updateDoc(getDocPath('products', orderModal.item.id), {
        orders: updatedOrders,
        isOrdered: updatedOrders.length > 0,
        orderedQuantity: updatedOrders.reduce((sum, o) => sum + o.amount, 0),
        arrivalDate: updatedOrders.length > 0 ? updatedOrders[0].date : null
      });

      setOrderModal({ isOpen: false, item: null, amount: '', date: '' });
      showToast("発注記録を追加しました");
    } catch (err) { setErrorMessage(`記録エラー: ${err.message}`); }
  };

  // 特定の発注記録をリストから削除（完了扱い）
  const removeSpecificOrder = async (orderIdToRemove) => {
    if (!user || !orderModal.item || !isEnvConfigured) return;
    
    try {
      let currentOrders = orderModal.item.orders || [];
      if (currentOrders.length === 0 && orderModal.item.isOrdered) {
        currentOrders = [{ id: 'legacy', amount: orderModal.item.orderedQuantity, date: orderModal.item.arrivalDate }];
      }

      const updatedOrders = currentOrders.filter(o => o.id !== orderIdToRemove);

      await updateDoc(getDocPath('products', orderModal.item.id), {
        orders: updatedOrders,
        isOrdered: updatedOrders.length > 0,
        orderedQuantity: updatedOrders.reduce((sum, o) => sum + o.amount, 0),
        arrivalDate: updatedOrders.length > 0 ? updatedOrders[0].date : null
      });
      
      setOrderModal(prev => ({
        ...prev,
        item: { ...prev.item, orders: updatedOrders, isOrdered: updatedOrders.length > 0 }
      }));
      showToast("発注分を完了としてリストから削除しました");
    } catch (err) { setErrorMessage(`エラー: ${err.message}`); }
  };

  const restoreInitialData = async () => {
    if (!user || initializing || !isEnvConfigured) return;
    setInitializing(true);
    try {
      const batch = writeBatch(db);
      // historyコレクションも初期化対象に含める
      for (const colName of ['products', 'materials', 'rawMaterials', 'history']) {
        const colRef = getBasePath(colName);
        const snapshot = await getDocs(query(colRef));
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        if (INITIAL_DATA[colName]) {
          INITIAL_DATA[colName].forEach((item, index) => {
            batch.set(doc(colRef), { ...item, order: index, createdAt: Date.now() });
          });
        }
      }
      await batch.commit();
      setIsSyncModalOpen(false);
      showToast("初期データの復元が完了しました");
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
            monthlyPace: 0,
            orders: []
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
      showToast("CSVデータの読み込みが完了しました");
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
    csvContent += "種類,品名,取扱会社,単価,前月数量,今月数量,合計金額,月間平均,発注状況\n";
    const addRows = (list, label) => list.forEach(i => {
      let orderStatus = "-";
      if (label === '商品') {
        const curOrders = i.orders || (i.isOrdered ? [{ amount: i.orderedQuantity, date: i.arrivalDate }] : []);
        if (curOrders.length > 0) {
          orderStatus = curOrders.map(o => `${o.amount}個(${o.date})`).join(' / ');
        }
      }
      csvContent += `${escapeCSV(label)},${escapeCSV(i.name)},${escapeCSV(i.company || '-')},${escapeCSV(formatNum(i.price))},${escapeCSV(formatNum(i.prevQuantity))},${escapeCSV(formatNum(i.quantity))},${escapeCSV(formatNum(i.price * i.quantity))},${escapeCSV(i.monthlyPace || '-')},${escapeCSV(orderStatus)}\n`;
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
        
        {orderAlertInfo.isAlertDay && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-amber-500 mr-3" />
              <div>
                <h3 className="font-black text-amber-800 whitespace-pre-line">{orderAlertInfo.message}</h3>
                <p className="text-sm font-bold text-amber-700 mt-1">「⚠️ 発注推奨」が出ている商品がないか確認し、メーカーへ発注を行ってください。</p>
              </div>
            </div>
          </div>
        )}

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
            {!isCanvasEnv && (
              <button onClick={handleLogout} className="flex items-center space-x-1 bg-white text-slate-500 ml-2 px-3 py-2 rounded-xl border border-slate-300 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all text-sm font-bold shadow-sm active:scale-95">
                <LogOut className="w-4 h-4" /><span>ログアウト</span>
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-indigo-100 mb-2"><Wallet className="w-5 h-5" /><h2 className="text-lg font-bold whitespace-nowrap">総合計金額</h2></div>
            <p className="text-4xl font-black tracking-tight">{formatCurrency(totals.grandTotal)}</p>
          </div>
          {[
            { label: '商品', val: totals.products, icon: Package, col: 'emerald', sub: [] },
            { label: '資材', val: totals.materials, icon: Layers, col: 'amber', sub: [{ l: '自社', v: totals.materialsOur }, { l: 'ウキシマ', v: totals.materialsUkishima }, { l: '中日本', v: totals.materialsNakanihon }] },
            { label: '原材料', val: totals.rawMaterials, icon: Shapes, col: 'blue', sub: [{ l: '自社', v: totals.rawMaterialsOur }, { l: 'ウキシマ', v: totals.rawMaterialsUkishima }, { l: '中日本', v: totals.rawMaterialsNakanihon }] }
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2"><s.icon className={`w-5 h-5 text-${s.col}-500`} /><h2 className="text-lg font-bold text-slate-700 whitespace-nowrap">{s.label} 合計</h2></div>
                <p className="text-3xl font-black text-slate-800">{formatCurrency(s.val)}</p>
              </div>
              {s.sub.length > 0 && (
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
                <h3 className={`font-black text-${section.color}-800 text-lg`}>{section.title}リスト</h3>
                <div className={`text-${section.color}-800 font-black bg-white px-4 py-1.5 rounded-xl shadow-sm border border-${section.color}-100`}>
                  {formatCurrency(totals[section.type + 's'] || totals[section.type])}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase border-b border-slate-100">
                      <th className="px-4 py-5 w-12 text-center whitespace-nowrap">#</th>
                      <th className="px-4 py-5 whitespace-nowrap">品名</th>
                      {section.type !== 'product' && <th className="px-4 py-5 text-center whitespace-nowrap">取扱会社</th>}
                      {section.type === 'product' && <th className="px-4 py-5 text-center whitespace-nowrap">月間平均</th>}
                      {section.type === 'product' && <th className="px-4 py-5 text-center whitespace-nowrap">ステータス (クリックで記録)</th>}
                      <th className="px-4 py-5 text-center whitespace-nowrap">現在庫 (直接修正)</th>
                      <th className="px-4 py-5 text-center whitespace-nowrap">日々の操作</th>
                      <th className="px-6 py-5 text-right whitespace-nowrap">単価</th>
                      <th className="px-6 py-5 text-right whitespace-nowrap">合計</th>
                      <th className="px-6 py-5 text-center w-16 whitespace-nowrap">削</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {section.list.length === 0 ? (<tr><td colSpan="10" className="px-6 py-16 text-center text-slate-300 font-bold">データなし</td></tr>) : (
                      section.list.map((item, idx) => {
                        // ★ 手動設定値と自動計算値の統合
                        const manualPace = item.monthlyPace || 0;
                        const autoPace = autoMonthlyPaces[item.id] || 0;
                        // 過去30日に実績があればそれを優先、なければ手動入力値
                        const effectiveMonthlyPace = autoPace > 0 ? autoPace : manualPace;
                        
                        const orderPoint = effectiveMonthlyPace * 6;
                        const targetInventory = effectiveMonthlyPace * 9;
                        
                        // 複数発注データの取得
                        const currentOrders = item.orders || (item.isOrdered ? [{ id: 'legacy', amount: item.orderedQuantity, date: item.arrivalDate }] : []);
                        const totalOrderedQty = currentOrders.reduce((sum, o) => sum + Number(o.amount), 0);
                        
                        const effectiveQuantity = item.quantity + totalOrderedQty;
                        const isUnderStock = effectiveMonthlyPace > 0 && effectiveQuantity < orderPoint;
                        const recommendQty = Math.max(0, targetInventory - effectiveQuantity);

                        // 枯渇リスクのシミュレーション (時間軸の進行)
                        let stockoutRisk = false;
                        let shortageAmount = 0;
                        let simulatedInventory = item.quantity;
                        const todayTime = new Date().setHours(0, 0, 0, 0);

                        if (effectiveMonthlyPace > 0 && currentOrders.length > 0) {
                          for (let i = 0; i < currentOrders.length; i++) {
                            const o = currentOrders[i];
                            const arrivalTime = new Date(o.date).getTime();
                            const diffDays = Math.ceil((arrivalTime - todayTime) / (1000 * 60 * 60 * 24));
                            
                            if (diffDays > 0) {
                              const expectedConsumption = (diffDays / 30) * effectiveMonthlyPace;
                              if (simulatedInventory < expectedConsumption) {
                                stockoutRisk = true;
                                shortageAmount = Math.ceil(expectedConsumption - simulatedInventory);
                                break;
                              }
                            }
                            simulatedInventory += Number(o.amount);
                          }
                        }

                        return (
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
                            <td className="px-4 py-4 font-black min-w-[180px]"><EditableCell value={item.name} onUpdate={(n) => updateItem(section.type, item.id, { name: n })} /></td>
                            
                            {section.type !== 'product' && (<td className="px-4 py-4 text-center"><span className={`px-2 py-1 rounded text-[10px] font-black whitespace-nowrap ${item.company === '当社' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{item.company}</span></td>)}
                            
                            {/* ★ 月間平均の表示（自動計算との連携） */}
                            {section.type === 'product' && (
                              <td className="px-4 py-4 text-center text-slate-500 font-bold whitespace-nowrap">
                                {autoPace > 0 ? (
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="text-indigo-600 font-black flex items-center" title="過去30日の出庫実績から自動算出">
                                      {autoPace} <span className="text-[8px] ml-1.5 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded shadow-sm">自動</span>
                                    </span>
                                    <div className="text-[8px] text-slate-400 mt-1 flex items-center" title="手動設定値">
                                       手動: <EditableCell value={manualPace} type="number" onUpdate={(p) => updateItem(section.type, item.id, { monthlyPace: p })} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center">
                                    <EditableCell value={manualPace} type="number" onUpdate={(p) => updateItem(section.type, item.id, { monthlyPace: p })} />
                                    <span className="text-[8px] text-slate-400 mt-1 opacity-50">手動</span>
                                  </div>
                                )}
                              </td>
                            )}

                            {/* 発注ステータス表示 */}
                            {section.type === 'product' && (
                              <td className="px-4 py-4 text-center align-top">
                                <div 
                                  onClick={() => {
                                    setOrderModal({ isOpen: true, item, amount: recommendQty || '', date: '' });
                                  }}
                                  className="inline-flex flex-col items-center justify-start cursor-pointer p-2 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors group/status relative min-w-[120px]"
                                >
                                  {currentOrders.length > 0 ? (
                                    <>
                                      {recommendQty > 0 ? (
                                        <>
                                          <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap flex items-center shadow-sm">
                                            <Truck className="w-3 h-3 mr-1" /> 発注済 (不足)
                                          </span>
                                          <span className="text-[10px] font-black text-red-500 mt-1 whitespace-nowrap">⚠️追加推奨: {recommendQty}</span>
                                        </>
                                      ) : (
                                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full whitespace-nowrap flex items-center shadow-sm mb-1">
                                          <Truck className="w-3 h-3 mr-1" /> 入荷待ち (十分)
                                        </span>
                                      )}
                                      
                                      {/* 内訳の表示 */}
                                      <div className="w-full mt-1.5 pt-1.5 border-t border-slate-200/50 flex flex-col items-center">
                                        <span className="text-[10px] font-black text-slate-700">計 {totalOrderedQty} 個</span>
                                        <div className="text-[8px] text-slate-500 mt-0.5 leading-tight text-center max-h-[40px] overflow-hidden group-hover/status:max-h-none transition-all">
                                          {currentOrders.map((o, i) => <div key={i}>{o.date}: {o.amount}個</div>)}
                                        </div>
                                      </div>
                                      
                                      {stockoutRisk && (
                                        <span className="text-[10px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded mt-1.5 border border-red-200 text-center leading-tight shadow-sm w-full">
                                          ⚠️入庫前に枯渇予測<br/>(約{shortageAmount}個不足)
                                        </span>
                                      )}
                                    </>
                                  ) : isUnderStock ? (
                                    <>
                                      <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-1 rounded-full whitespace-nowrap flex items-center shadow-sm">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> 発注推奨
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-500 mt-1">推奨: {recommendQty}</span>
                                    </>
                                  ) : (
                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full whitespace-nowrap flex items-center">
                                      <Check className="w-3 h-3 mr-1" /> 良好
                                    </span>
                                  )}
                                  <span className="text-[8px] font-black text-indigo-400 mt-2 opacity-0 group-hover/status:opacity-100 transition-opacity whitespace-nowrap">クリックで詳細・追加</span>
                                </div>
                              </td>
                            )}

                            {/* ★ 現在庫の直接編集時にも履歴を記録 */}
                            <td className="px-4 py-4 text-center">
                              <QuantityInput 
                                value={item.quantity} 
                                onUpdate={async (q) => {
                                  const diff = q - item.quantity;
                                  if (diff === 0) return;
                                  await updateItem(section.type, item.id, { prevQuantity: item.quantity, quantity: q });
                                  const action = diff > 0 ? 'add' : 'sub';
                                  await addHistoryLog(item, section.type, action, Math.abs(diff), q);
                                }} 
                              />
                            </td>
                            
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button onClick={() => setAdjustModal({ isOpen: true, item, type: section.type, action: 'sub', amount: '' })} className="whitespace-nowrap px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black rounded-lg transition-colors flex items-center border border-red-100">
                                  <Minus className="w-3 h-3 mr-1 flex-shrink-0" />出庫
                                </button>
                                <button onClick={() => setAdjustModal({ isOpen: true, item, type: section.type, action: 'add', amount: '' })} className="whitespace-nowrap px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-black rounded-lg transition-colors flex items-center border border-emerald-100">
                                  <Plus className="w-3 h-3 mr-1 flex-shrink-0" />入庫
                                </button>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-right font-bold text-slate-500 whitespace-nowrap"><EditableCell value={item.price} type="number" format={formatCurrency} onUpdate={(p) => updateItem(section.type, item.id, { price: p })} /></td>
                            <td className="px-6 py-4 text-right font-black text-slate-900 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</td>
                            <td className="px-6 py-4 text-center">
                              <button onClick={() => removeItem(section.type, item.id)} className="text-slate-300 hover:text-red-500 transition-all p-2 rounded-xl hover:bg-red-50"><Trash2 className="w-5 h-5" /></button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSV Import Modal */}
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
              <p className="text-slate-600 font-bold mb-6">全データを消去し、初期化します。現在登録されているデータはすべて失われますがよろしいですか？</p>
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
                {type === 'product' && (
                  <div><label className="block text-xs font-black text-slate-400 mb-2">月間平均出荷数 (初期値)</label><input type="number" required value={monthlyPace} onChange={(e) => setMonthlyPace(e.target.value)} className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none font-bold" /></div>
                )}
                {type !== 'product' && (
                  <div><label className="block text-xs font-black text-slate-400 mb-2">取扱会社</label><select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none font-bold"><option value="当社">当社</option><option value="ウキシマメディカル">ウキシマメディカル</option><option value="中日本カプセル">中日本カプセル</option></select></div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-black text-slate-400 mb-2">単価</label><input type="number" required step="any" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none font-bold" /></div>
                  <div><label className="block text-xs font-black text-slate-400 mb-2">初期数量</label><input type="number" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none font-bold" /></div>
                </div>
                <button type="submit" className="w-full py-4 px-6 rounded-2xl text-white font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl transition-all">追加する</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 出庫・入庫モーダル */}
      {adjustModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border-2 ${adjustModal.action === 'add' ? 'border-emerald-400' : 'border-red-400'}`}>
            <div className={`px-6 py-4 flex items-center justify-between ${adjustModal.action === 'add' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <h3 className={`text-lg font-black flex items-center ${adjustModal.action === 'add' ? 'text-emerald-700' : 'text-red-700'}`}>
                {adjustModal.action === 'add' ? <Plus className="w-5 h-5 mr-2" /> : <Minus className="w-5 h-5 mr-2" />}
                {adjustModal.item?.name} の{adjustModal.action === 'add' ? '入庫' : '出庫'}
              </h3>
              <button onClick={() => setAdjustModal({ isOpen: false, item: null, type: '', action: '', amount: '' })} className="text-slate-400 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form onSubmit={executeAdjustment} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2 text-center uppercase">数量を入力してください</label>
                  <input type="number" required min="1" autoFocus value={adjustModal.amount} onChange={(e) => setAdjustModal({ ...adjustModal, amount: e.target.value })} className={`w-full px-5 py-4 text-center text-3xl font-black border-2 rounded-2xl outline-none transition-all ${adjustModal.action === 'add' ? 'border-emerald-200 focus:border-emerald-500 text-emerald-700' : 'border-red-200 focus:border-red-500 text-red-700'}`} />
                </div>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setAdjustModal({ isOpen: false, item: null, type: '', action: '', amount: '' })} className="flex-1 py-3 rounded-xl text-slate-600 bg-slate-100 font-black">キャンセル</button>
                  <button type="submit" className={`flex-1 py-3 rounded-xl text-white font-black shadow-lg ${adjustModal.action === 'add' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>確定する</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 発注記録モーダル */}
      {orderModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-blue-400">
            <div className="px-6 py-4 flex items-center justify-between bg-blue-50">
              <h3 className="text-lg font-black flex items-center text-blue-700">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {orderModal.item?.name} の発注管理
              </h3>
              <button onClick={() => setOrderModal({ isOpen: false, item: null, amount: '', date: '' })} className="text-slate-400 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              
              {/* 既存の発注記録リスト */}
              {(() => {
                const curOrders = orderModal.item?.orders || (orderModal.item?.isOrdered ? [{ id: 'legacy', amount: orderModal.item.orderedQuantity, date: orderModal.item.arrivalDate }] : []);
                if (curOrders.length > 0) {
                  return (
                    <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-black text-slate-500 mb-3 uppercase flex items-center">
                        <Truck className="w-4 h-4 mr-1" /> 現在の入荷待ちリスト
                      </h4>
                      <div className="space-y-2">
                        {curOrders.map((o) => (
                          <div key={o.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-colors group">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-black text-indigo-600">{o.date} 着</span>
                              <span className="text-sm font-bold text-slate-700">{o.amount} 個</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeSpecificOrder(o.id)}
                              className="text-emerald-500 hover:text-white p-1.5 bg-emerald-50 hover:bg-emerald-500 rounded-lg transition-colors border border-emerald-200 flex items-center space-x-1"
                              title="この発注分を完了（リストから削除）する"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-3 text-center">
                        商品が届いたら、日々の操作で「+入庫」をした後に、<br/>右側の✅ボタンを押してリストから消去してください。
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 新規の発注フォーム */}
              <form onSubmit={executeOrderRecord} className="space-y-4">
                <h4 className="text-xs font-black text-blue-600 mb-2 uppercase border-b border-blue-100 pb-2 flex items-center">
                  <Plus className="w-4 h-4 mr-1" /> 新しい発注を記録する
                </h4>

                {/* 先回りした在庫枯渇予測日（デッドライン：現在庫のみで計算） */}
                {(() => {
                  // ★ ここでも自動計算の月間ペースを反映してデッドラインを算出
                  const manualPace = orderModal.item?.monthlyPace || 0;
                  const autoPace = autoMonthlyPaces[orderModal.item?.id] || 0;
                  const effectivePace = autoPace > 0 ? autoPace : manualPace;

                  if (orderModal.item && effectivePace > 0) {
                    const currentQty = orderModal.item.quantity;
                    const pacePerDay = effectivePace / 30;
                    
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    
                    const daysUntilEmpty = currentQty / pacePerDay;
                    const stockoutDate = new Date(today.getTime() + daysUntilEmpty * 24*60*60*1000);

                    const diffTotalDays = Math.max(0, Math.floor(daysUntilEmpty));
                    const y = stockoutDate.getFullYear();
                    const m = stockoutDate.getMonth() + 1;
                    const d = stockoutDate.getDate();
                    
                    const isDanger = diffTotalDays <= 30;
                    
                    return (
                      <div className={`p-3 rounded-xl border ${isDanger ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                        <h4 className={`text-[10px] font-black uppercase flex items-center mb-1 ${isDanger ? 'text-red-500' : 'text-slate-500'}`}>
                          <Calendar className="w-3 h-3 mr-1" /> 追加発注がない場合の枯渇予測日 (デッドライン)
                        </h4>
                        <p className={`text-sm font-bold ${isDanger ? 'text-red-700' : 'text-slate-700'}`}>
                          {y}年{m}月{d}日 <span className="text-xs opacity-70 font-black">（約 {diffTotalDays} 日後）</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* リアルタイム枯渇予測（入力した日付がデッドラインを超えた場合） */}
                {(() => {
                  const manualPace = orderModal.item?.monthlyPace || 0;
                  const autoPace = autoMonthlyPaces[orderModal.item?.id] || 0;
                  const effectivePace = autoPace > 0 ? autoPace : manualPace;

                  if (orderModal.item && orderModal.date && effectivePace > 0) {
                    const arrival = new Date(orderModal.date);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const diffDays = Math.ceil((arrival.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays > 0) {
                      const expectedConsumption = (diffDays / 30) * effectivePace;
                      
                      const curOrders = orderModal.item?.orders || (orderModal.item?.isOrdered ? [{ id: 'legacy', amount: orderModal.item.orderedQuantity, date: orderModal.item.arrivalDate }] : []);
                      const preArrivals = curOrders.filter(o => new Date(o.date) < arrival).reduce((sum, o) => sum + Number(o.amount), 0);
                      const availableQty = orderModal.item.quantity + preArrivals;

                      if (availableQty < expectedConsumption) {
                        const shortage = Math.ceil(expectedConsumption - availableQty);
                        return (
                          <div className="bg-red-50 p-3 rounded-xl border border-red-200 animate-pulse shadow-sm mt-2">
                            <p className="text-[11px] font-bold text-red-700 flex items-start leading-tight">
                              <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                              指定日（{diffDays}日後）だと、到着前に在庫が尽きる恐れがあります。（約{shortage}個不足予測）
                            </p>
                          </div>
                        );
                      }
                    }
                  }
                  return null;
                })()}
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase">数量</label>
                    <input type="number" required min="1" value={orderModal.amount} onChange={(e) => setOrderModal({ ...orderModal, amount: e.target.value })} className="w-full px-4 py-3 text-lg font-black border-2 rounded-xl outline-none transition-all border-blue-200 focus:border-blue-500 text-blue-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase">予定日</label>
                    <input type="date" required value={orderModal.date} onChange={(e) => setOrderModal({ ...orderModal, date: e.target.value })} className="w-full px-4 py-3 text-sm font-black border-2 rounded-xl outline-none transition-all border-blue-200 focus:border-blue-500 text-blue-700" />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full py-4 rounded-xl text-white font-black shadow-lg bg-blue-500 hover:bg-blue-600 transition-colors active:scale-95 flex justify-center items-center">
                    記録を追加する
                  </button>
                </div>
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
