import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Plus, Edit2, Trash2, X, AlertCircle, Phone, MapPin, Building } from 'lucide-react';

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [supplierName, setSupplierName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối khi tải danh sách nhà cung cấp.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setSupplierName('');
    setPhone('');
    setAddress('');
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingId(sup.SupplierId);
    setSupplierName(sup.SupplierName);
    setPhone(sup.Phone || '');
    setAddress(sup.Address || '');
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierName.trim()) return;

    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, {
          SupplierName: supplierName,
          Phone: phone,
          Address: address
        });
      } else {
        await api.post('/suppliers', {
          SupplierName: supplierName,
          Phone: phone,
          Address: address
        });
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa nhà cung cấp này do có liên kết dữ liệu.');
    }
  };

  const filteredSuppliers = suppliers.filter(sup => 
    sup.SupplierName.toLowerCase().includes(search.toLowerCase()) ||
    (sup.Phone && sup.Phone.includes(search))
  );

  return (
    <div className="bg-white border border-sky-100 p-6 rounded-2xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Danh sách nhà cung cấp</h2>
          <p className="text-sm text-slate-500">Quản lý thông tin nhà cung cấp vật tư cho khách sạn (Đồ tiêu hao, đồ vải, hóa chất...)</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-all self-start sm:self-auto shadow-md shadow-sky-500/10"
        >
          <Plus size={16} /> Thêm nhà cung cấp
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên nhà cung cấp hoặc số điện thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-sky-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
        />
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Bảng dữ liệu */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sky-100 text-xs font-semibold text-slate-455 uppercase tracking-wider bg-sky-50/50">
                <th className="py-3 px-4">Tên nhà cung cấp</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Địa chỉ</th>
                <th className="py-3 px-4 text-right no-print">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-sm text-slate-400">
                    Không tìm thấy nhà cung cấp nào.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.SupplierId} className="border-b border-sky-50 hover:bg-sky-50/20 transition-all text-sm text-slate-700">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <Building size={16} className="text-sky-500 shrink-0" />
                      {sup.SupplierName}
                    </td>
                    <td className="py-3.5 px-4">
                      {sup.Phone ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                          <Phone size={12} className="text-slate-400" /> {sup.Phone}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Chưa cập nhật</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      {sup.Address ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin size={12} className="text-slate-400 shrink-0" /> {sup.Address}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Chưa cập nhật</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 no-print">
                      <button
                        onClick={() => handleOpenEdit(sup)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(sup.SupplierId)}
                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-all"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Thêm / Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
          <div className="bg-white border border-sky-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 bg-sky-50/30">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit2 size={16} className="text-sky-600" /> : <Plus size={18} className="text-sky-600" />}
                {editingId ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle size={14} /> {submitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase tracking-wider">Tên nhà cung cấp *</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Ví dụ: Công ty TNHH Cung ứng Sao Mai"
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase tracking-wider">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase tracking-wider">Địa chỉ</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: 123 Đường Trần Phú, Nha Trang"
                  rows="3"
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-sky-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-sky-100 hover:bg-slate-50 text-slate-500 rounded-xl text-sm font-medium transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-sky-500/10"
                >
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
