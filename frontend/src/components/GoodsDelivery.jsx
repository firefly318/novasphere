import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash2, Printer, X, Eye, FileText, Package, AlertCircle } from 'lucide-react';

function MaterialSelect({ value, onChange, materials, placeholder = "-- Chọn vật tư --", showStock = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  
  const sortedMaterials = React.useMemo(() => {
    return [...materials].sort((a, b) => 
      a.TenVatTu.localeCompare(b.TenVatTu, 'vi', { sensitivity: 'base' })
    );
  }, [materials]);
  
  const filteredMaterials = React.useMemo(() => {
    let result = sortedMaterials;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(m => 
        m.TenVatTu.toLowerCase().includes(q) ||
        m.MaCodeVatTu.toLowerCase().includes(q)
      );
    }
    if (selectedCat) {
      const catId = parseInt(selectedCat);
      result = result.filter(m => m.MaDanhMuc === catId);
    }
    return result;
  }, [sortedMaterials, search, selectedCat]);
  
  const selectedMaterial = materials.find(m => String(m.MaVatTu) === String(value));

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      }
    };
    fetchCats();
  }, [isOpen]);

  return (
    <div className="relative w-full text-slate-800" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-sky-150 rounded-lg px-3 py-2 text-xs text-left text-slate-800 flex justify-between items-center focus:outline-none focus:border-sky-500 transition-all h-9"
      >
        <span className="truncate">
          {selectedMaterial ? (
            showStock ? (
              `${selectedMaterial.TenVatTu} (${selectedMaterial.MaCodeVatTu}) [Tồn hiện tại: ${selectedMaterial.SoLuongTon} ${selectedMaterial.DonViTinh}]`
            ) : (
              `${selectedMaterial.TenVatTu} (${selectedMaterial.MaCodeVatTu})`
            )
          ) : placeholder}
        </span>
        <span className="text-slate-400 text-[10px] ml-1 shrink-0">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-sky-100 rounded-xl shadow-xl p-2 space-y-2 max-h-72 flex flex-col min-w-[280px]">
          <div className="flex gap-1.5 shrink-0">
            <input
              type="text"
              autoFocus
              placeholder="Tìm tên hoặc mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-50 border border-sky-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all placeholder:text-slate-400 min-w-0"
            />
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-32 bg-slate-50 border border-sky-100 rounded-lg px-1.5 py-1 text-[10px] text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white transition-all font-medium shrink-0"
            >
              <option value="">Tất cả loại</option>
              {categories.map(c => (
                <option key={c.MaDanhMuc} value={c.MaDanhMuc}>{c.TenDanhMuc}</option>
              ))}
            </select>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-3 text-[11px] text-slate-400">Không tìm thấy vật tư</div>
            ) : (
              filteredMaterials.map(m => (
                <button
                  key={m.MaVatTu}
                  type="button"
                  onClick={() => {
                    onChange(m.MaVatTu);
                    setIsOpen(false);
                    setSearch('');
                    setSelectedCat('');
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs hover:bg-sky-50 transition-all flex flex-col ${
                    String(m.MaVatTu) === String(value) ? 'bg-sky-50/50 text-sky-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="font-medium">{m.TenVatTu}</span>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5">
                    <span>{m.MaCodeVatTu}</span>
                    {showStock && (
                      <span className="font-semibold text-sky-600">Tồn: {m.SoLuongTon} {m.DonViTinh}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoodsDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View states
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form states
  const [departmentId, setDepartmentId] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([{ MaterialId: '', SoLuong: 1 }]);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchDeliveries();
    fetchMaterials();
    fetchDepartments();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/deliveries');
      setDeliveries(res.data);
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối khi tải danh sách phiếu xuất kho.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await api.get('/materials');
      setMaterials(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { MaterialId: '', SoLuong: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const invalidItem = items.some(item => !item.MaterialId || item.SoLuong <= 0);
    if (invalidItem) {
      setSubmitError('Vui lòng chọn vật tư và nhập số lượng xuất lớn hơn 0.');
      return;
    }

    if (!departmentId) {
      setSubmitError('Vui lòng chọn bộ phận nhận vật tư.');
      return;
    }

    try {
      const payload = {
        DepartmentId: parseInt(departmentId),
        GhiChu: note,
        ChiTiet: items.map(item => ({
          MaterialId: parseInt(item.MaterialId),
          SoLuong: parseInt(item.SoLuong)
        }))
      };

      await api.post('/deliveries', payload);
      setSubmitSuccess(true);
      setDepartmentId('');
      setNote('');
      setItems([{ MaterialId: '', SoLuong: 1 }]);
      fetchDeliveries();
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('list');
      }, 1500);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Lỗi lập phiếu xuất kho.');
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await api.get(`/deliveries/${id}`);
      setSelectedDelivery(res.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      alert('Không thể tải chi tiết phiếu xuất kho.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-sky-100 p-6 rounded-2xl shadow-sm relative text-slate-800">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-sky-100 pb-4 mb-6 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý xuất kho vật tư (GDN)</h2>
          <p className="text-sm text-slate-500">Yêu cầu cấp phát xuất kho và đồng bộ trừ tồn kho trực tiếp vào SQL Server.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'list' 
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/10' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-750 border border-sky-100'
            }`}
          >
            Lịch sử xuất kho
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'create' 
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/10' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-750 border border-sky-100'
            }`}
          >
            Tạo yêu cầu xuất
          </button>
        </div>
      </div>

      {/* 1. TAB LIST */}
      {activeTab === 'list' && (
        <div className="no-print">
          {error ? (
            <div className="text-red-650 bg-red-50 p-4 rounded-xl border border-red-100 text-sm">
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-600"></div>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Không tìm thấy phiếu xuất kho nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-sky-100 text-slate-500 bg-sky-50/20">
                    <th className="py-3 px-4 font-bold">Số phiếu xuất</th>
                    <th className="py-3 px-4 font-bold">Ngày xuất</th>
                    <th className="py-3 px-4 font-bold">Bộ phận nhận</th>
                    <th className="py-3 px-4 font-bold">Người lập phiếu</th>
                    <th className="py-3 px-4 font-bold">Lý do</th>
                    <th className="py-3 px-4 font-bold text-right w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.MaPhieuXuat} className="border-b border-sky-50 hover:bg-sky-50/10 transition-all">
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{d.SoPhieuXuat}</td>
                      <td className="py-3.5 px-4 text-slate-500">{new Date(d.NgayXuat).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">{d.BoPhanNhan}</td>
                      <td className="py-3.5 px-4 text-slate-600">{d.NguoiYeuCau}</td>
                      <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">{d.GhiChu || '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(d.MaPhieuXuat)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 text-slate-500 hover:text-sky-600 rounded-lg border border-sky-100 text-xs font-semibold ml-auto transition-all"
                        >
                          <Eye size={14} /> Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. TAB CREATE */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-6 no-print">
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-650 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle size={18} /> {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl">
              Cấp phát xuất kho thành công! Số lượng hàng đã được tự động trừ tồn kho.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">BỘ PHẬN NHẬN VẬT TƯ *</label>
              <select
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-slate-50 border border-sky-150 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              >
                <option value="">-- Chọn bộ phận khách sạn --</option>
                {departments.map(d => (
                  <option key={d.DepartmentId} value={d.DepartmentId}>{d.DepartmentName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">LÝ DO XUẤT KHO / GHI CHÚ</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập lý do xuất (Ví dụ: Setup phòng VIP, thay bóng đèn hỏng...)"
                className="w-full bg-slate-50 border border-sky-150 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-sky-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-700">Danh sách vật tư xuất</h3>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-semibold transition-all"
              >
                <Plus size={14} /> Thêm dòng
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50/50 p-3 border border-sky-100 rounded-xl">
                  {/* Vật tư */}
                  <div className="md:col-span-8">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">VẬT TƯ *</label>
                    <MaterialSelect
                      value={item.MaterialId}
                      onChange={(val) => handleItemChange(index, 'MaterialId', val)}
                      materials={materials}
                      placeholder="-- Chọn vật tư cần xuất --"
                      showStock={true}
                    />
                  </div>

                  {/* Số lượng */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">SỐ LƯỢNG XUẤT *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      value={item.SoLuong}
                      onChange={(e) => handleItemChange(index, 'SoLuong', e.target.value)}
                      className="w-full bg-white border border-sky-150 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-all text-right"
                    />
                  </div>

                  {/* Thao tác xóa */}
                  <div className="md:col-span-1 text-center md:pb-1">
                    <button
                      type="button"
                      disabled={items.length === 1}
                      onClick={() => handleRemoveItemRow(index)}
                      className="p-2 bg-white border border-sky-150 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-sky-100">
            <button
              type="button"
              onClick={() => {
                setDepartmentId('');
                setNote('');
                setItems([{ MaterialId: '', SoLuong: 1 }]);
                setActiveTab('list');
              }}
              className="px-4 py-2 border border-sky-150 hover:bg-slate-50 text-slate-500 rounded-xl text-sm font-semibold transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-sky-500/10"
            >
              Xuất kho cấp phát
            </button>
          </div>
        </form>
      )}

      {/* 3. DETAIL MODAL */}
      {isDetailModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-sky-100 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] no-print">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100">
              <h3 className="text-base font-bold text-slate-850 flex items-center gap-1.5">
                <FileText size={18} className="text-indigo-650" />
                Chi tiết phiếu xuất kho
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-sky-500/10"
                >
                  <Printer size={14} /> In phiếu
                </button>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-slate-400 hover:text-slate-705 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 bg-sky-50/20 p-4 border border-sky-100 rounded-xl">
                <div>
                  <p className="text-[10px] font-semibold text-slate-455">SỐ PHIẾU XUẤT</p>
                  <p className="text-sm font-bold text-indigo-600 mt-0.5">{selectedDelivery.SoPhieuXuat}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-455">BỘ PHẬN NHẬN HÀNG</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{selectedDelivery.BoPhanNhan}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-455">NGƯỜI LẬP YÊU CẦU</p>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedDelivery.NguoiYeuCau} | {new Date(selectedDelivery.NgayXuat).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-455">LÝ DO XUẤT KHO</p>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedDelivery.GhiChu || '—'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Danh sách mặt hàng xuất kho</h4>
                <div className="overflow-hidden border border-sky-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-sky-50/20 border-b border-sky-100 text-slate-500">
                        <th className="py-2.5 px-4 font-bold">Mã code</th>
                        <th className="py-2.5 px-4 font-bold">Tên vật tư</th>
                        <th className="py-2.5 px-4 font-bold">ĐVT</th>
                        <th className="py-2.5 px-4 font-bold text-right">Số lượng xuất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDelivery.ChiTiet?.map((item, idx) => (
                        <tr key={idx} className="border-b border-sky-50 hover:bg-sky-50/10 transition-all">
                          <td className="py-3 px-4 font-semibold text-slate-500">{item.MaCodeVatTu}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{item.TenVatTu}</td>
                          <td className="py-3 px-4 text-slate-550">{item.DonViTinh}</td>
                          <td className="py-3 px-4 font-bold text-slate-750 text-right">{item.SoLuong.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY AREA */}
      {selectedDelivery && (
        <div className="hidden print:block print-container font-sans text-black p-8">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold uppercase">Khách sạn Grand Royal</h1>
            <p className="text-xs">Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh</p>
            <p className="text-xs font-semibold mt-1">HỆ THỐNG QUẢN LÝ VẬT TƯ KHÁCH SẠN</p>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold uppercase">Phiếu Xuất Kho Vật Tư</h2>
            <p className="text-sm font-semibold">Số phiếu: {selectedDelivery.SoPhieuXuat}</p>
            <p className="text-xs">Ngày cấp phát: {new Date(selectedDelivery.NgayXuat).toLocaleString()}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm leading-relaxed">
            <div>
              <p><strong>Bộ phận nhận:</strong> {selectedDelivery.BoPhanNhan}</p>
              <p><strong>Người lập yêu cầu:</strong> {selectedDelivery.NguoiYeuCau}</p>
              <p><strong>Lý do xuất:</strong> {selectedDelivery.GhiChu || '—'}</p>
            </div>
            <div className="text-right">
              <p><strong>Ngày in phiếu:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse border border-black mb-8">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black py-2 px-3 text-left">Mã code</th>
                <th className="border border-black py-2 px-3 text-left">Tên vật tư</th>
                <th className="border border-black py-2 px-3 text-center">ĐVT</th>
                <th className="border border-black py-2 px-3 text-right">Số lượng xuất</th>
              </tr>
            </thead>
            <tbody>
              {selectedDelivery.ChiTiet?.map((item, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="border border-black py-2 px-3">{item.MaCodeVatTu}</td>
                  <td className="border border-black py-2 px-3">{item.TenVatTu}</td>
                  <td className="border border-black py-2 px-3 text-center">{item.DonViTinh}</td>
                  <td className="border border-black py-2 px-3 text-right">{item.SoLuong.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 text-center text-sm font-semibold mt-12">
            <div>
              <p>Người lập phiếu (Đề xuất)</p>
              <div className="h-16"></div>
              <p className="mt-4">{selectedDelivery.NguoiYeuCau}</p>
            </div>
            <div>
              <p>Thủ kho xuất hàng</p>
              <div className="h-16"></div>
              <p className="mt-4">........................................</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
