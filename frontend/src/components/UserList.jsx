import React, { useState, useEffect } from 'react';
import api from '../api';
import { Shield, Key, CheckSquare, Square, AlertCircle, RefreshCw, X, Save, Copy, Check } from 'lucide-react';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reset password states
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit permissions states
  const [editUser, setEditUser] = useState(null);
  const [permBits, setPermBits] = useState(0);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const length = 10;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specials = '!@#$%^&*';
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specials[Math.floor(Math.random() * specials.length)];
    
    const allChars = uppercase + lowercase + numbers + specials;
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const handleOpenReset = (user) => {
    setResetUser(user);
    const pwd = generateRandomPassword();
    setNewPassword(pwd);
    setResetError(null);
    setResetSuccess(false);
    setCopied(false);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegeneratePassword = () => {
    const pwd = generateRandomPassword();
    setNewPassword(pwd);
    setCopied(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);

    if (newPassword.trim().length < 6) {
      setResetError('Mật khẩu phải dài từ 6 ký tự trở lên.');
      return;
    }

    try {
      await api.post(`/admin/users/${resetUser.UserId}/reset-password`, { newPassword });
      setResetSuccess(true);
      setTimeout(() => {
        setResetUser(null);
      }, 1500);
    } catch (err) {
      setResetError(err.response?.data?.message || err.message || 'Lỗi khi reset mật khẩu.');
    }
  };

  const handleOpenEditPerms = (user) => {
    setEditUser(user);
    setPermBits(user.Permissions);
    setEditError(null);
  };

  const handleToggleBit = (bitValue) => {
    setPermBits(prev => prev ^ bitValue);
  };

  const handleSavePermissions = async () => {
    setEditError(null);
    try {
      await api.put(`/admin/users/${editUser.UserId}/permissions`, { permissions: permBits });
      fetchUsers();
      setEditUser(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Lỗi khi cập nhật phân quyền.');
    }
  };

  const permissionBits = [
    { value: 1, name: 'Xem dữ liệu', desc: 'Quyền xem danh sách, chi tiết' },
    { value: 2, name: 'Tạo mới dữ liệu', desc: 'Quyền thêm danh mục, vật tư, phiếu kho' },
    { value: 4, name: 'Sửa dữ liệu', desc: 'Quyền sửa đổi thông tin phần tử' },
    { value: 8, name: 'Reset mật khẩu', desc: 'Quyền quản trị reset mật khẩu tài khoản khác (Bit 8)' }
  ];

  return (
    <div className="bg-white border border-sky-100 p-6 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden text-slate-800">
      <div className="flex items-center justify-between border-b border-sky-100 pb-4 mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Tài Khoản & Phân Quyền Động</h2>
          <p className="text-sm text-slate-500">Phân quyền thông qua thuộc tính Bitfield và đặt lại mật khẩu cho các tài khoản người dùng.</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="p-2.5 bg-slate-50 hover:bg-sky-50 border border-sky-100 text-slate-500 hover:text-sky-600 rounded-xl transition-all"
          title="Tải lại danh sách"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {error ? (
        <div className="text-red-655 bg-red-50 p-4 rounded-xl border border-red-100 text-sm flex items-center gap-2 shrink-0">
          <AlertCircle size={18} /> {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12 flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-600"></div>
        </div>
      ) : (
        <div className="overflow-auto flex-1 border border-sky-50 rounded-xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 bg-slate-50 border-b border-sky-100 text-slate-500">
                <th className="py-3 px-4 font-bold bg-slate-50">Tên Đăng Nhập</th>
                <th className="py-3 px-4 font-bold bg-slate-50">Họ và Tên</th>
                <th className="py-3 px-4 font-bold bg-slate-50">Vai Trò</th>
                <th className="py-3 px-4 font-bold bg-slate-50">Trạng Thái</th>
                <th className="py-3 px-4 font-bold bg-slate-50">Quyền Bitfield</th>
                <th className="py-3 px-4 font-bold text-right bg-slate-50">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.UserId} className="border-b border-sky-50 hover:bg-sky-50/10 transition-all">
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{u.Username}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">{u.FullName}</td>
                  <td className="py-3.5 px-4 text-slate-550">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      u.RoleId === 1 ? 'bg-purple-50 border border-purple-100 text-purple-600' :
                      u.RoleId === 2 ? 'bg-sky-50 border border-sky-100 text-sky-600' :
                      'bg-slate-100 border border-slate-200 text-slate-600'
                    }`}>
                      {u.RoleName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-xs font-semibold ${u.IsActive ? 'text-emerald-500' : 'text-red-500'}`}>
                      {u.IsActive ? 'Đang hoạt động' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs">
                        Value: {u.Permissions}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({permissionBits.map(b => (u.Permissions & b.value) ? '1' : '0').reverse().join('')}b)
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditPerms(u)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-sky-50 text-slate-500 hover:text-sky-600 rounded-lg border border-sky-100 text-xs font-semibold transition-all"
                      >
                        <Shield size={12} /> Cập nhật quyền
                      </button>
                      <button
                        onClick={() => handleOpenReset(u)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-lg border border-sky-100 text-xs font-semibold transition-all"
                      >
                        <Key size={12} /> Reset mật khẩu
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-sky-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Key size={16} className="text-red-500" />
                Reset mật khẩu người dùng
              </h3>
              <button 
                onClick={() => setResetUser(null)}
                className="text-slate-400 hover:text-slate-700 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Nhập mật khẩu mới cho tài khoản <strong className="text-slate-700 font-bold">{resetUser.Username}</strong> ({resetUser.FullName}).
              </p>

              {resetError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-655 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle size={14} /> {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl">
                  Đã cập nhật mật khẩu mới thành công!
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">MẬT KHẨU MỚI (ĐƯỢC TẠO NGẪU NHIÊN) *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Mật khẩu ngẫu nhiên..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-sky-150 rounded-xl pl-4 pr-12 py-2.5 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className={`absolute right-2 top-2 p-1.5 rounded-lg border transition-all ${
                        copied 
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-650' 
                          : 'bg-white hover:bg-slate-50 border-sky-100 text-slate-500 hover:text-sky-600'
                      }`}
                      title={copied ? "Đã copy!" : "Copy mật khẩu"}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegeneratePassword}
                    className="px-3 py-2 bg-slate-50 hover:bg-sky-50 border border-sky-150 hover:border-sky-300 text-slate-500 hover:text-sky-600 rounded-xl text-sm font-semibold transition-all flex items-center justify-center"
                    title="Tạo mật khẩu khác"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                {copied && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Đã sao chép mật khẩu vào bộ nhớ tạm!</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-4 py-2 border border-sky-150 hover:bg-slate-50 text-slate-555 rounded-xl text-sm font-semibold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-red-500/10"
                >
                  Reset Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Permissions (Bitfield) */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-sky-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Shield size={16} className="text-sky-600" />
                Thiết lập quyền động (Bitfield)
              </h3>
              <button 
                onClick={() => setEditUser(null)}
                className="text-slate-400 hover:text-slate-700 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-sky-50/30 p-3.5 border border-sky-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">TÀI KHOẢN ĐANG CẤU HÌNH</p>
                  <p className="text-sm font-bold text-slate-700">{editUser.FullName} ({editUser.Username})</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-400">GIÁ TRỊ BITFIELD TỔNG</p>
                  <p className="text-lg font-bold text-sky-600">{permBits}</p>
                </div>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-655 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle size={14} /> {editError}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">DANH SÁCH BIT QUYỀN HẠN</label>
                <div className="space-y-2.5">
                  {permissionBits.map((bit) => {
                    const isChecked = (permBits & bit.value) === bit.value;
                    return (
                      <button
                        key={bit.value}
                        type="button"
                        onClick={() => handleToggleBit(bit.value)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                          isChecked 
                            ? 'bg-sky-50/20 border-sky-200 text-slate-800' 
                            : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-555'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0 text-sky-600">
                          {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                        </span>
                        <div>
                          <p className={`text-xs font-bold flex items-center gap-1.5 ${isChecked ? 'text-slate-800' : 'text-slate-600'}`}>
                            {bit.name}
                            <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-500 rounded font-sans">Bit: {bit.value}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{bit.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 border border-sky-150 hover:bg-slate-50 text-slate-555 rounded-xl text-sm font-semibold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-sky-500/10"
                >
                  <Save size={14} /> Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
