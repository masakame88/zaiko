import React, { useState, useMemo, useEffect } from 'react';
import { Package, Layers, Building2, Plus, Trash2, DollarSign, Wallet, Store, Briefcase, Calendar, Shapes, Edit2, Download, X, GripVertical } from 'lucide-react';

// リスト上で数量を直接編集するためのコンポーネント
const QuantityInput = ({ value, onUpdate }) => {
  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  const handleBlur = () => {
    const num = Number(val);
    if (val === '' || isNaN(num) || num < 0) {
      setVal(value);
    } else if (num !== value) {
      onUpdate(num);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <input
      type="number"
      inputMode="decimal"
      min="0"
      step="any"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onFocus={(e) => e.target.select()}
      className="w-20 px-2 py-1 text-right text-slate-800 font-bold border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm"
      title="数値を入力してEnterで更新"
    />
  );
};

// リスト上でテキストや単価をクリックして編集するためのコンポーネント
const EditableCell = ({ value, type = "text", onUpdate, format, className = "" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  const startEdit = () => {
    setVal(value);
    setIsEditing(true);
  };

  const commitEdit = () => {
    setIsEditing(false);
    if (type === 'number') {
      const num = Number(val);
      if (val !== '' && !isNaN(num) && num >= 0 && num !== value) {
        onUpdate(num);
      } else {
        setVal(value);
      }
    } else {
      if (typeof val === 'string' && val.trim() !== '' && val !== value) {
        onUpdate(val);
      } else {
        setVal(value);
      }
    }
  };

  if (isEditing) {
    return (
      <input
        type={type}
        step={type === 'number' ? "any" : undefined}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        autoFocus
        onFocus={(e) => e.target.select()}
        className={`w-full px-2 py-1 text-sm border border-indigo-400 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-inner ${type === 'number' ? 'text-right' : 'text-left'} ${className}`}
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      className={`group cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 px-2 py-1 -mx-2 rounded transition-colors border border-transparent hover:border-indigo-200 relative flex items-center ${type === 'number' ? 'justify-end' : 'justify-between'} ${className}`}
      title="クリックして編集"
    >
      <span className="truncate">{format ? format(value) : value}</span>
      <Edit2 className={`w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0 ${type === 'number' ? 'ml-2' : 'ml-2'}`} />
    </div>
  );
};

export default function App() {
  const [products, setProducts] = useState([
    { id: 'p1', name: 'KP88携帯用', price: 267.3, prevQuantity: 0, quantity: 2992 },
    { id: 'p2', name: 'カニパック', price: 1165.3, prevQuantity: 0, quantity: 243 },
    { id: 'p3', name: 'カニパック88', price: 1211.5, prevQuantity: 0, quantity: 660 },
    { id: 'p4', name: 'カニパック 90', price: 982.8, prevQuantity: 0, quantity: 57 },
    { id: 'p5', name: 'KPKP280粒', price: 1345.1, prevQuantity: 0, quantity: 0 },
    { id: 'p6', name: 'KPKP 21-S', price: 1437, prevQuantity: 0, quantity: 0 },
    { id: 'p7', name: 'KPKP 21-H', price: 993.1, prevQuantity: 0, quantity: 0 },
    { id: 'p8', name: 'カニパックス-A60g', price: 1290, prevQuantity: 0, quantity: 0 },
    { id: 'p9', name: 'カニパックアレ', price: 1040, prevQuantity: 0, quantity: 0 },
    { id: 'p10', name: 'KPLR210粒', price: 3253, prevQuantity: 0, quantity: 0 },
    { id: 'p11', name: 'KPKR150粒', price: 1670, prevQuantity: 0, quantity: 0 },
    { id: 'p12', name: '缶スタンド', price: 20, prevQuantity: 0, quantity: 0 },
    { id: 'p13', name: '斜め刃爪切り', price: 219, prevQuantity: 0, quantity: 180 },
    { id: 'p14', name: 'キトナコス', price: 1832.6, prevQuantity: 0, quantity: 131 },
    { id: 'p15', name: '除菌ウエットレジカゴバッグ', price: 110, prevQuantity: 0, quantity: 69 }
  ]);

  const [rawMaterials, setRawMaterials] = useState([
    { id: 'r1', name: '天然にがり', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 0 },
    { id: 'r2', name: 'コーヨーキトサンFL-80', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 0 },
    { id: 'r3', name: 'コーヨーキトサンSK-2', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 0 },
    { id: 'r4', name: 'コーヨーキチンオリゴ糖', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 0 },
    { id: 'r5', name: 'コーヨーオリゴグルコサミンWG', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 0 },
    { id: 'r6', name: 'サンゴ末焼成カルシウムCCP-44', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 0 },
    { id: 'r7', name: 'コーヨーキトサン FH-80<カニ由来>', company: '中日本カプセル', price: 0, prevQuantity: 0, quantity: 0.508 }
  ]);

  const [materials, setMaterials] = useState([
    { id: 'm_add2_1', name: '共通カニパック 6本箱', company: '当社', price: 78.6, prevQuantity: 0, quantity: 0 },
    { id: 'm_add2_2', name: '新共通カニパック2021 36本箱', company: '当社', price: 88, prevQuantity: 0, quantity: 247 },
    { id: 'm_add2_3', name: '中仕切り', company: '当社', price: 5.6, prevQuantity: 0, quantity: 4200 },
    { id: 'm_add2_4', name: 'カニパックスーＡ６０ｇ ６本箱', company: '当社', price: 82.2, prevQuantity: 0, quantity: 353 },
    { id: 'm_add2_5', name: 'カニパックスーＡ６０ｇ シュリンク', company: '当社', price: 4, prevQuantity: 0, quantity: 3036 },
    { id: 'm_add2_6', name: 'カニパックスーＡ６０ｇ 36本箱', company: '当社', price: 60, prevQuantity: 0, quantity: 95 },
    { id: 'm_add2_7', name: 'カニパックスーＡ６０ｇ スプーン', company: '当社', price: 2, prevQuantity: 0, quantity: 8200 },
    { id: 'm_add2_8', name: 'カニパック２２８０ 6本箱', company: '当社', price: 170, prevQuantity: 0, quantity: 0 },
    { id: 'm_add2_9', name: 'カニパック２８０ 化粧箱', company: '当社', price: 88, prevQuantity: 0, quantity: 0 },
    { id: 'm_add2_10', name: 'カニパック ８８携帯用 袋 2025', company: '当社', price: 33.5, prevQuantity: 0, quantity: 0 },
    { id: 'm_add2_11', name: 'ウキシマKP88携帯袋', company: '当社', price: 33.5, prevQuantity: 0, quantity: 2300 },
    { id: 'm1', name: 'ダンボール144入', company: '当社', price: 0, prevQuantity: 0, quantity: 0 },
    { id: 'm2', name: '白ダンボール(60サイズ)', company: '当社', price: 0, prevQuantity: 0, quantity: 0 },
    { id: 'm12', name: '新・共通36本ダンボール箱', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 0 },
    { id: 'm13', name: '共通6本箱', company: 'ウキシマメディカル', price: 147.5, prevQuantity: 0, quantity: 0 },
    { id: 'm14', name: '共通6本仕切りセット', company: 'ウキシマメディカル', price: 5.6, prevQuantity: 0, quantity: 0 },
    { id: 'm15', name: '乾燥剤', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 0 },
    { id: 'm16', name: 'ロングビン 塩ビシュリンクフィルム', company: 'ウキシマメディカル', price: 5.9, prevQuantity: 0, quantity: 0 },
    { id: 'm17', name: 'カニパック ケースロング', company: 'ウキシマメディカル', price: 161, prevQuantity: 0, quantity: 0 },
    { id: 'm27', name: 'カニパック90 (240粒)ラベル', company: 'ウキシマメディカル', price: 45, prevQuantity: 0, quantity: 913 },
    { id: 'm28', name: 'カニパック90 (240粒) 6本箱・36本箱シール', company: 'ウキシマメディカル', price: 2, prevQuantity: 0, quantity: 4459 },
    { id: 'm29', name: 'KPKP共通ホワイトキャップ', company: 'ウキシマメディカル', price: 20.2, prevQuantity: 0, quantity: 1263 },
    { id: 'm30', name: 'KPKP280 1本', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 2367 },
    { id: 'm31', name: 'KPKP280 6本', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 53 },
    { id: 'm32', name: '新KPKP280 ボトル', company: 'ウキシマメディカル', price: 75, prevQuantity: 0, quantity: 474 },
    { id: 'm33', name: 'KPKP280 ラベル', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 1971 },
    { id: 'm34', name: 'KPKP280 塩ビシュ', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 446 },
    { id: 'm35', name: 'KPKP280 36本箱', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 100 },
    { id: 'm36', name: 'カニパックKR ボトル', company: 'ウキシマメディカル', price: 0, prevQuantity: 0, quantity: 21 },
    { id: 'm48', name: 'ボトル カニパック専用', company: '中日本カプセル', price: 0, prevQuantity: 0, quantity: 187 },
    { id: 'm49', name: 'キャップ カニパック専用', company: '中日本カプセル', price: 0, prevQuantity: 0, quantity: 106 },
    { id: 'm50', name: '防湿ボリ栓 カニバック専用', company: '中日本カプセル', price: 0, prevQuantity: 0, quantity: 720 },
    { id: 'm51', name: 'カニパック ラベル(210粒)', company: '中日本カプセル', price: 0, prevQuantity: 0, quantity: 53 },
    { id: 'm52', name: '入内箱 カニパック専用', company: '中日本カプセル', price: 0, prevQuantity: 0, quantity: 2 },
    { id: 'm53', name: '出荷箱36入(6内箱)カニバック専用', company: '中日本カプセル', price: 0, prevQuantity: 0, quantity: 1 },
    { id: 'm54', name: '6入内箱用仕切 カニバック専用', company: '中日本カプセル', price: 0, prevQuantity: 0, quantity: 0 }
  ]);

  // ドラッグ&ドロップ用の状態
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [dragType, setDragType] = useState(null); // 'product' | 'material' | 'rawMaterial'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('product');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [company, setCompany] = useState('当社');

  const [targetMonth, setTargetMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const displayMonthInfo = useMemo(() => {
    const [y, m] = targetMonth.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: `${date.getFullYear()}年${date.getMonth() + 1}月分`
    };
  }, [targetMonth]);

  const [materialFilter, setMaterialFilter] = useState('すべて');
  const [rawMaterialFilter, setRawMaterialFilter] = useState('すべて');

  // 並べ替えロジック
  const handleDragStart = (index, listType) => {
    setDraggedItem(index);
    setDragType(listType);
  };

  const handleDragEnter = (index) => {
    setDragOverItem(index);
  };

  const handleDragEnd = () => {
    if (draggedItem === null || dragOverItem === null) {
      resetDragState();
      return;
    }

    const reorder = (list) => {
      const newList = [...list];
      const movedItem = newList.splice(draggedItem, 1)[0];
      newList.splice(dragOverItem, 0, movedItem);
      return newList;
    };

    if (dragType === 'product') setProducts(reorder(products));
    if (dragType === 'material') setMaterials(reorder(materials));
    if (dragType === 'rawMaterial') setRawMaterials(reorder(rawMaterials));

    resetDragState();
  };

  const resetDragState = () => {
    setDraggedItem(null);
    setDragOverItem(null);
    setDragType(null);
  };

  const totals = useMemo(() => {
    const productsTotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const rawMaterialsTotal = rawMaterials.reduce((sum, r) => sum + (r.price * r.quantity), 0);
    const rawMaterialsOur = rawMaterials.filter(r => r.company === '当社').reduce((sum, r) => sum + (r.price * r.quantity), 0);
    const rawMaterialsA = rawMaterials.filter(r => r.company === 'ウキシマメディカル').reduce((sum, r) => sum + (r.price * r.quantity), 0);
    const rawMaterialsB = rawMaterials.filter(r => r.company === '中日本カプセル').reduce((sum, r) => sum + (r.price * r.quantity), 0);
    const materialsOur = materials.filter(m => m.company === '当社').reduce((sum, m) => sum + (m.price * m.quantity), 0);
    const materialsA = materials.filter(m => m.company === 'ウキシマメディカル').reduce((sum, m) => sum + (m.price * m.quantity), 0);
    const materialsB = materials.filter(m => m.company === '中日本カプセル').reduce((sum, m) => sum + (m.price * m.quantity), 0);
    const materialsTotal = materialsOur + materialsA + materialsB;
    return {
      products: productsTotal,
      rawMaterials: rawMaterialsTotal,
      rawMaterialsOur,
      rawMaterialsA,
      rawMaterialsB,
      materials: materialsTotal,
      materialsOur,
      materialsA,
      materialsB,
      grandTotal: productsTotal + rawMaterialsTotal + materialsTotal
    };
  }, [products, rawMaterials, materials]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !price || !quantity) return;
    const newItem = { id: Date.now().toString(), name, price: Number(price), prevQuantity: 0, quantity: Number(quantity) };
    if (type === 'product') setProducts([...products, newItem]);
    else if (type === 'rawMaterial') setRawMaterials([...rawMaterials, { ...newItem, company }]);
    else setMaterials([...materials, { ...newItem, company }]);
    setName(''); setPrice(''); setQuantity(''); setIsModalOpen(false);
  };

  const removeProduct = (id) => setProducts(products.filter(p => p.id !== id));
  const removeRawMaterial = (id) => setRawMaterials(rawMaterials.filter(r => r.id !== id));
  const removeMaterial = (id) => setMaterials(materials.filter(m => m.id !== id));

  const updateProduct = (id, updates) => setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  const updateRawMaterial = (id, updates) => setRawMaterials(rawMaterials.map(r => r.id === id ? { ...r, ...updates } : r));
  const updateMaterial = (id, updates) => setMaterials(materials.map(m => m.id === id ? { ...m, ...updates } : m));

  const exportToCSV = () => {
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;
    const formatNumber = (num) => String(num.toLocaleString());
    
    let csvContent = `${escapeCSV(displayMonthInfo.label + " 在庫報告書")}\n`;
    csvContent += `集計基準月,${escapeCSV(targetMonth)}\n\n`;
    csvContent += `【集計サマリー】\n`;
    csvContent += `項目,金額\n`;
    csvContent += `総合計金額,${escapeCSV(formatNumber(totals.grandTotal))}\n\n`;
    csvContent += `商品 合計,${escapeCSV(formatNumber(totals.products))}\n\n`;
    csvContent += `資材 合計,${escapeCSV(formatNumber(totals.materials))}\n`;
    csvContent += `├ 当社,${escapeCSV(formatNumber(totals.materialsOur))}\n`;
    csvContent += `├ ウキシマメディカル,${escapeCSV(formatNumber(totals.materialsA))}\n`;
    csvContent += `└ 中日本カプセル,${escapeCSV(formatNumber(totals.materialsB))}\n\n`;
    csvContent += `原材料 合計,${escapeCSV(formatNumber(totals.rawMaterials))}\n`;
    csvContent += `├ 当社,${escapeCSV(formatNumber(totals.rawMaterialsOur))}\n`;
    csvContent += `├ ウキシマメディカル,${escapeCSV(formatNumber(totals.rawMaterialsA))}\n`;
    csvContent += `└ 中日本カプセル,${escapeCSV(formatNumber(totals.rawMaterialsB))}\n\n`;
    csvContent += `【明細データ】\n`;
    csvContent += "種類,品名,取扱会社,単価,前月数量,今月数量,合計金額\n";
    products.forEach(p => csvContent += `${escapeCSV('商品')},${escapeCSV(p.name)},${escapeCSV('-')},${escapeCSV(formatNumber(p.price))},${escapeCSV(formatNumber(p.prevQuantity))},${escapeCSV(formatNumber(p.quantity))},${escapeCSV(formatNumber(p.price * p.quantity))}\n`);
    rawMaterials.forEach(r => csvContent += `${escapeCSV('原材料')},${escapeCSV(r.name)},${escapeCSV(r.company)},${escapeCSV(formatNumber(r.price))},${escapeCSV(formatNumber(r.prevQuantity))},${escapeCSV(formatNumber(r.quantity))},${escapeCSV(formatNumber(r.price * r.quantity))}\n`);
    materials.forEach(m => csvContent += `${escapeCSV('資材')},${escapeCSV(m.name)},${escapeCSV(m.company)},${escapeCSV(formatNumber(m.price))},${escapeCSV(formatNumber(m.prevQuantity))},${escapeCSV(formatNumber(m.quantity))},${escapeCSV(formatNumber(m.price * m.quantity))}\n`);
    
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `在庫表_${displayMonthInfo.label}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans relative select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{displayMonthInfo.label} 在庫表</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Inventory Reporting System</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-lg border border-indigo-600 shadow-sm hover:bg-indigo-700 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" />
              <span>新規登録</span>
            </button>
            <button onClick={exportToCSV} className="flex items-center space-x-1 bg-white px-3 py-2 rounded-lg border border-slate-300 shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors text-sm font-medium text-slate-700">
              <Download className="w-4 h-4" />
              <span>CSV出力</span>
            </button>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-slate-300 shadow-sm hover:border-indigo-300 transition-colors">
              <Calendar className="w-5 h-5 text-slate-400" />
              <label htmlFor="target-month" className="text-sm font-medium text-slate-700 whitespace-nowrap">集計基準月:</label>
              <input id="target-month" type="month" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} className="outline-none bg-transparent font-bold text-indigo-600 cursor-pointer" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-6 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-indigo-100 mb-2">
              <Wallet className="w-5 h-5" />
              <h2 className="text-lg font-medium">総合計金額</h2>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(totals.grandTotal)}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-slate-500 mb-2">
              <Package className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-medium text-slate-700">商品 合計</h2>
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(totals.products)}</p>
            <p className="text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 px-2 py-0.5 rounded-full inline-block self-start">{products.length} Items</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2 text-slate-500">
                <Layers className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-medium text-slate-700">資材 合計</h2>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(totals.materials)}</p>
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-50 pt-2">
              <div className="flex justify-between text-xs items-center"><span className="text-slate-500">当社</span><span className="font-bold">{formatCurrency(totals.materialsOur)}</span></div>
              <div className="flex justify-between text-xs items-center"><span className="text-slate-500">ウキシマ</span><span className="font-bold">{formatCurrency(totals.materialsA)}</span></div>
              <div className="flex justify-between text-xs items-center"><span className="text-slate-500">中日本</span><span className="font-bold">{formatCurrency(totals.materialsB)}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2 text-slate-500">
                <Shapes className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-medium text-slate-700">原材料 合計</h2>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(totals.rawMaterials)}</p>
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-50 pt-2">
              <div className="flex justify-between text-xs items-center"><span className="text-slate-500">当社</span><span className="font-bold">{formatCurrency(totals.rawMaterialsOur)}</span></div>
              <div className="flex justify-between text-xs items-center"><span className="text-slate-500">ウキシマ</span><span className="font-bold">{formatCurrency(totals.rawMaterialsA)}</span></div>
              <div className="flex justify-between text-xs items-center"><span className="text-slate-500">中日本</span><span className="font-bold">{formatCurrency(totals.rawMaterialsB)}</span></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 商品リスト */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
              <h3 className="font-bold text-emerald-800 flex items-center"><Package className="w-5 h-5 mr-2" />商品リスト</h3>
              <span className="text-emerald-700 font-bold bg-white px-3 py-1 rounded-lg shadow-sm border border-emerald-100">{formatCurrency(totals.products)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">
                    <th className="px-3 py-4 w-10 text-center"></th>
                    <th className="px-3 py-4 font-semibold">品名</th>
                    <th className="px-6 py-4 font-semibold text-right">数量推移 (前月 ➔ 今月)</th>
                    <th className="px-6 py-4 font-semibold text-right">単価</th>
                    <th className="px-6 py-4 font-semibold text-right">合計金額</th>
                    <th className="px-6 py-4 font-semibold text-center w-20">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      draggable 
                      onDragStart={() => handleDragStart(idx, 'product')}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`hover:bg-slate-50/80 transition-all group ${draggedItem === idx && dragType === 'product' ? 'opacity-30 bg-slate-100' : ''} ${dragOverItem === idx && dragType === 'product' ? 'border-t-2 border-emerald-500' : ''}`}
                    >
                      <td className="px-3 py-3 text-slate-300 cursor-grab active:cursor-grabbing group-hover:text-slate-400">
                        <GripVertical className="w-4 h-4 mx-auto" />
                      </td>
                      <td className="px-3 py-3 text-slate-700 font-medium"><EditableCell value={item.name} onUpdate={(n) => updateProduct(item.id, { name: n })} /></td>
                      <td className="px-6 py-3 text-right flex items-center justify-end"><span className="text-slate-400 text-xs mr-2">{item.prevQuantity}</span><span className="mx-2 text-slate-300">➔</span><QuantityInput value={item.quantity} onUpdate={(q) => updateProduct(item.id, { prevQuantity: item.quantity, quantity: q })} /></td>
                      <td className="px-6 py-3 text-right"><EditableCell value={item.price} type="number" format={formatCurrency} onUpdate={(p) => updateProduct(item.id, { price: p })} /></td>
                      <td className="px-6 py-3 text-right font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                      <td className="px-6 py-3 text-center"><button onClick={() => removeProduct(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 資材リスト */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
              <h3 className="font-bold text-amber-800 flex items-center"><Layers className="w-5 h-5 mr-2" />資材リスト</h3>
              <span className="text-amber-700 font-bold bg-white px-3 py-1 rounded-lg shadow-sm border border-amber-100">{formatCurrency(totals.materials)}</span>
            </div>
            <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/30 flex space-x-2 overflow-x-auto">
              {['すべて', '当社', 'ウキシマメディカル', '中日本カプセル'].map(f => (
                <button key={f} onClick={() => setMaterialFilter(f)} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${materialFilter === f ? 'bg-amber-100 border-amber-200 text-amber-800 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>{f}</button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">
                    <th className="px-3 py-4 w-10 text-center"></th>
                    <th className="px-3 py-4 font-semibold">品名</th>
                    {materialFilter === 'すべて' && <th className="px-6 py-4 font-semibold text-center">取扱会社</th>}
                    <th className="px-6 py-4 font-semibold text-right">数量推移</th>
                    <th className="px-6 py-4 font-semibold text-right">単価</th>
                    <th className="px-6 py-4 font-semibold text-right">合計</th>
                    <th className="px-6 py-4 font-semibold text-center w-20">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.filter(m => materialFilter === 'すべて' || m.company === materialFilter).map((item, idx) => (
                    <tr 
                      key={item.id} 
                      draggable 
                      onDragStart={() => handleDragStart(idx, 'material')}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`hover:bg-slate-50/80 transition-all group ${draggedItem === idx && dragType === 'material' ? 'opacity-30 bg-slate-100' : ''} ${dragOverItem === idx && dragType === 'material' ? 'border-t-2 border-amber-500' : ''}`}
                    >
                      <td className="px-3 py-3 text-slate-300 cursor-grab active:cursor-grabbing group-hover:text-slate-400">
                        <GripVertical className="w-4 h-4 mx-auto" />
                      </td>
                      <td className="px-3 py-3 text-slate-700 font-medium"><EditableCell value={item.name} onUpdate={(n) => updateMaterial(item.id, { name: n })} /></td>
                      {materialFilter === 'すべて' && <td className="px-6 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.company === '当社' ? 'bg-indigo-50 text-indigo-600' : item.company === 'ウキシマメディカル' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{item.company}</span></td>}
                      <td className="px-6 py-3 text-right flex items-center justify-end"><span className="text-slate-400 text-xs mr-2">{item.prevQuantity}</span><span className="mx-2 text-slate-300">➔</span><QuantityInput value={item.quantity} onUpdate={(q) => updateMaterial(item.id, { prevQuantity: item.quantity, quantity: q })} /></td>
                      <td className="px-6 py-3 text-right"><EditableCell value={item.price} type="number" format={formatCurrency} onUpdate={(p) => updateMaterial(item.id, { price: p })} /></td>
                      <td className="px-6 py-3 text-right font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                      <td className="px-6 py-3 text-center"><button onClick={() => removeMaterial(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 原材料リスト */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
              <h3 className="font-bold text-blue-800 flex items-center"><Shapes className="w-5 h-5 mr-2" />原材料リスト</h3>
              <span className="text-blue-700 font-bold bg-white px-3 py-1 rounded-lg shadow-sm border border-blue-100">{formatCurrency(totals.rawMaterials)}</span>
            </div>
            <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/30 flex space-x-2 overflow-x-auto">
              {['すべて', '当社', 'ウキシマメディカル', '中日本カプセル'].map(f => (
                <button key={f} onClick={() => setRawMaterialFilter(f)} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${rawMaterialFilter === f ? 'bg-blue-100 border-blue-200 text-blue-800 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>{f}</button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">
                    <th className="px-3 py-4 w-10 text-center"></th>
                    <th className="px-3 py-4 font-semibold">品名</th>
                    {rawMaterialFilter === 'すべて' && <th className="px-6 py-4 font-semibold text-center">取扱会社</th>}
                    <th className="px-6 py-4 font-semibold text-right">数量推移</th>
                    <th className="px-6 py-4 font-semibold text-right">単価</th>
                    <th className="px-6 py-4 font-semibold text-right">合計</th>
                    <th className="px-6 py-4 font-semibold text-center w-20">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rawMaterials.filter(r => rawMaterialFilter === 'すべて' || r.company === rawMaterialFilter).map((item, idx) => (
                    <tr 
                      key={item.id} 
                      draggable 
                      onDragStart={() => handleDragStart(idx, 'rawMaterial')}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`hover:bg-slate-50/80 transition-all group ${draggedItem === idx && dragType === 'rawMaterial' ? 'opacity-30 bg-slate-100' : ''} ${dragOverItem === idx && dragType === 'rawMaterial' ? 'border-t-2 border-blue-500' : ''}`}
                    >
                      <td className="px-3 py-3 text-slate-300 cursor-grab active:cursor-grabbing group-hover:text-slate-400">
                        <GripVertical className="w-4 h-4 mx-auto" />
                      </td>
                      <td className="px-3 py-3 text-slate-700 font-medium"><EditableCell value={item.name} onUpdate={(n) => updateRawMaterial(item.id, { name: n })} /></td>
                      {rawMaterialFilter === 'すべて' && <td className="px-6 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.company === '当社' ? 'bg-indigo-50 text-indigo-600' : item.company === 'ウキシマメディカル' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{item.company}</span></td>}
                      <td className="px-6 py-3 text-right flex items-center justify-end"><span className="text-slate-400 text-xs mr-2">{item.prevQuantity}</span><span className="mx-2 text-slate-300">➔</span><QuantityInput value={item.quantity} onUpdate={(q) => updateRawMaterial(item.id, { prevQuantity: item.quantity, quantity: q })} /></td>
                      <td className="px-6 py-3 text-right"><EditableCell value={item.price} type="number" format={formatCurrency} onUpdate={(p) => updateRawMaterial(item.id, { price: p })} /></td>
                      <td className="px-6 py-3 text-right font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                      <td className="px-6 py-3 text-center"><button onClick={() => removeRawMaterial(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center"><Plus className="w-5 h-5 mr-2 text-indigo-500" />新規アイテム登録</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-white p-1 rounded-full shadow-sm transition-all border border-transparent hover:border-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button type="button" onClick={() => setType('product')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'product' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>商品</button>
                  <button type="button" onClick={() => setType('material')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'material' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>資材</button>
                  <button type="button" onClick={() => setType('rawMaterial')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'rawMaterial' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>原材料</button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">品名</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50/50" placeholder="名称を入力してください" />
                </div>
                {(type === 'material' || type === 'rawMaterial') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">取扱会社</label>
                    <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50/50 appearance-none">
                      <option value="当社">当社</option>
                      <option value="ウキシマメディカル">ウキシマメディカル</option>
                      <option value="中日本カプセル">中日本カプセル</option>
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">単価 (円)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">¥</div>
                      <input type="number" required min="0" step="any" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50/50" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">初期数量</label>
                    <input type="number" required min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50/50" placeholder="0" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 px-4 rounded-xl text-white font-bold transition-all bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 mt-2">登録を確定する</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
