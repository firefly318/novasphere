import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối khi tải danh sách loại vật tư.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingId(cat.MaDanhMuc);
    setName(cat.TenDanhMuc);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { TenDanhMuc: name });
      } else {
        await api.post('/categories', { TenDanhMuc: name });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa loại vật tư này?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa danh mục này.');
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.TenDanhMuc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white border border-sky-100 p-6 rounded-2xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Danh mục loại vật tư</h2>
          <p className="text-sm text-slate-500">Quản lý và phân loại vật tư lưu kho khách sạn (Amenities, Đồ vải, Hóa chất...)</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-all self-start sm:self-auto shadow-md shadow-sky-500/10"
        >
          <Plus size={16} /> Thêm loại mới
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm loại vật tư..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-sky-100 text-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition-all placeholder:text-slate-400"
        />
      </div>

      {error ? (
        <div className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-600"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Không tìm thấy loại vật tư nào.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-sky-100 text-slate-500 bg-sky-50/20">
                <th className="py-3 px-4 font-bold w-20">Mã ID</th>
                <th className="py-3 px-4 font-bold">Tên loại vật tư</th>
                <th className="py-3 px-4 font-bold text-right w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.MaDanhMuc} className="border-b border-sky-50 hover:bg-sky-50/10 transition-all">
                  <td className="py-3.5 px-4 font-semibold text-slate-400">#{cat.MaDanhMuc}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{cat.TenDanhMuc}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-400 hover:text-sky-600 transition-all border border-transparent hover:border-sky-100"
                        title="Sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.MaDanhMuc)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-sky-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingId ? 'Cập nhật loại vật tư' : 'Thêm loại vật tư mới'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 transition-all"
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
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">TÊN LOẠI VẬT TƯ *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Đồ vải khách sạn"
                  className="w-full bg-slate-50 border border-sky-150 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-sky-150 hover:bg-slate-50 text-slate-550 rounded-xl text-sm font-semibold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-sky-500/10"
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
