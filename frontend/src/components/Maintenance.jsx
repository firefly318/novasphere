import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Search, Plus, Edit2, Trash2, X, AlertCircle, Wrench, 
  AlertTriangle, CheckCircle, Clock, Calendar, ShieldAlert,
  User, DollarSign, PenTool, CheckSquare, Activity
} from 'lucide-react';

export default function Maintenance() {
  const user = (() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  })();
  const isReadOnly = user?.roleId === 2;

  const [activeSubTab, setActiveSubTab] = useState('requests');
  const [materials, setMaterials] = useState([]);
  
  // Data States
  const [requests, setRequests] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Form States - Requests
  const [reqMaterialId, setReqMaterialId] = useState('');
  const [reqLocation, setReqLocation] = useState('');
  const [reqDescription, setReqDescription] = useState('');
  const [reqPriority, setReqPriority] = useState('Trung bình');

  // Form States - Schedules
  const [schMaterialId, setSchMaterialId] = useState('');
  const [schLocation, setSchLocation] = useState('');
  const [schCycleDays, setSchCycleDays] = useState('90');
  const [schNextDate, setSchNextDate] = useState('');
  const [schNotes, setSchNotes] = useState('');

  // Form States - Receipts
  const [recMaterialId, setRecMaterialId] = useState('');
  const [recRequestId, setRecRequestId] = useState('');
  const [recType, setRecType] = useState('Bảo trì định kỳ');
  const [recCost, setRecCost] = useState('0');
  const [recTechName, setRecTechName] = useState('');
  const [recResult, setRecResult] = useState('Hoàn thành tốt');
  const [recNotes, setRecNotes] = useState('');

  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    fetchMaterials();
    fetchRequests();
    fetchSchedules();
    if (!isReadOnly) {
      fetchReceipts();
    }
  }, [isReadOnly]);

  const fetchMaterials = async () => {
    try {
      const res = await api.get('/materials');
      // Lọc các thiết bị có thể bảo trì sử dụng lại được (Thiết bị điện tử)
      const electronicMaterials = res.data.filter(m => 
        m.TenDanhMuc === 'Thiết bị điện tử' || m.MaCodeVatTu.startsWith('ELE')
      );
      setMaterials(electronicMaterials);
    } catch (err) {
      console.error('Lỗi tải danh mục vật tư:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/maintenance/requests');
      setRequests(res.data);
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu bảo trì.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/maintenance/schedules');
      setSchedules(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReceipts = async () => {
    try {
      const res = await api.get('/maintenance/receipts');
      setReceipts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Request (Báo hỏng)
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqMaterialId || !reqLocation || !reqDescription) {
      setSubmitError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    try {
      await api.post('/maintenance/requests', {
        MaterialId: reqMaterialId,
        Location: reqLocation,
        Description: reqDescription,
        Priority: reqPriority
      });
      setIsRequestModalOpen(false);
      fetchRequests();
      resetRequestForm();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Lỗi gửi yêu cầu báo hỏng.');
    }
  };

  const resetRequestForm = () => {
    setReqMaterialId('');
    setReqLocation('');
    setReqDescription('');
    setReqPriority('Trung bình');
    setSubmitError(null);
  };

  // Update Request Status (e.g. to Đang sửa)
  const handleUpdateReqStatus = async (id, status) => {
    try {
      await api.put(`/maintenance/requests/${id}`, { Status: status });
      fetchRequests();
    } catch (err) {
      alert('Không thể cập nhật trạng thái yêu cầu.');
    }
  };

  // Submit Schedule (Cài đặt lịch định kỳ)
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!schMaterialId || !schLocation || !schCycleDays || !schNextDate) {
      setSubmitError('Vui lòng điền đầy đủ thông tin lịch bảo trì.');
      return;
    }
    try {
      await api.post('/maintenance/schedules', {
        MaterialId: schMaterialId,
        Location: schLocation,
        CycleDays: parseInt(schCycleDays),
        NextMaintenanceDate: schNextDate,
        Notes: schNotes
      });
      setIsScheduleModalOpen(false);
      fetchSchedules();
      resetScheduleForm();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Lỗi lưu lịch bảo trì.');
    }
  };

  const resetScheduleForm = () => {
    setSchMaterialId('');
    setSchLocation('');
    setSchCycleDays('90');
    setSchNextDate('');
    setSchNotes('');
    setSubmitError(null);
  };

  // Pre-fill Receipt Form from a Request or Schedule
  const openReceiptFromRequest = (req) => {
    setRecMaterialId(req.MaterialId);
    setRecRequestId(req.RequestId);
    setRecType('Sửa chữa báo hỏng');
    setRecCost('0');
    setRecTechName('');
    setRecResult('Hoàn thành tốt');
    setRecNotes(`Sửa chữa theo yêu cầu báo hỏng tại vị trí: ${req.Location}. Lỗi báo cáo: ${req.Description}`);
    setSubmitError(null);
    setIsReceiptModalOpen(true);
  };

  const openReceiptFromSchedule = (sch) => {
    setRecMaterialId(sch.MaterialId);
    setRecRequestId('');
    setRecType('Bảo trì định kỳ');
    setRecCost('0');
    setRecTechName('');
    setRecResult('Hoàn thành tốt');
    setRecNotes(`Bảo trì định kỳ thiết bị tại vị trí: ${sch.Location}`);
    setSubmitError(null);
    setIsReceiptModalOpen(true);
  };

  // Submit Receipt (Lập phiếu sửa chữa/bảo trì)
  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!recMaterialId || !recType || !recTechName || !recResult) {
      setSubmitError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    try {
      await api.post('/maintenance/receipts', {
        MaterialId: recMaterialId,
        RequestId: recRequestId ? parseInt(recRequestId) : null,
        MaintenanceType: recType,
        Cost: parseFloat(recCost) || 0,
        TechnicianName: recTechName,
        ResultStatus: recResult,
        Notes: recNotes
      });
      setIsReceiptModalOpen(false);
      fetchRequests();
      fetchSchedules();
      fetchReceipts();
      resetReceiptForm();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Lỗi lập phiếu bảo trì.');
    }
  };

  const resetReceiptForm = () => {
    setRecMaterialId('');
    setRecRequestId('');
    setRecType('Bảo trì định kỳ');
    setRecCost('0');
    setRecTechName('');
    setRecResult('Hoàn thành tốt');
    setRecNotes('');
    setSubmitError(null);
  };

  // Filtering
  const filteredRequests = requests.filter(r => 
    r.MaterialName.toLowerCase().includes(search.toLowerCase()) ||
    r.Location.toLowerCase().includes(search.toLowerCase()) ||
    r.Status.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSchedules = schedules.filter(s => 
    s.MaterialName.toLowerCase().includes(search.toLowerCase()) ||
    s.Location.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReceipts = receipts.filter(r => 
    r.MaterialName.toLowerCase().includes(search.toLowerCase()) ||
    r.TechnicianName.toLowerCase().includes(search.toLowerCase()) ||
    r.MaintenanceType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sub Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100 pb-4">
        <div className="flex gap-2 p-1 bg-sky-50 rounded-2xl border border-sky-100 self-start">
          <button
            onClick={() => { setActiveSubTab('requests'); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              activeSubTab === 'requests' 
                ? 'bg-white text-sky-700 shadow-sm border border-sky-100' 
                : 'text-slate-500 hover:text-sky-600'
            }`}
          >
            <AlertTriangle size={16} /> Báo Hỏng Thiết Bị
          </button>
          <button
            onClick={() => { setActiveSubTab('schedules'); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              activeSubTab === 'schedules' 
                ? 'bg-white text-sky-700 shadow-sm border border-sky-100' 
                : 'text-slate-500 hover:text-sky-600'
            }`}
          >
            <Calendar size={16} /> Lịch Bảo Trì Định Kỳ
          </button>
          {!isReadOnly && (
            <button
              onClick={() => { setActiveSubTab('receipts'); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                activeSubTab === 'receipts' 
                  ? 'bg-white text-sky-700 shadow-sm border border-sky-100' 
                  : 'text-slate-500 hover:text-sky-600'
              }`}
            >
              <CheckSquare size={16} /> Phiếu Bảo Trì / Sửa Chữa
            </button>
          )}
        </div>

        {/* Buttons to open modals */}
        {!isReadOnly && activeSubTab === 'requests' && (
          <button
            onClick={() => { resetRequestForm(); setIsRequestModalOpen(true); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-red-500/10"
          >
            <AlertTriangle size={16} /> Báo hỏng khẩn cấp
          </button>
        )}
        {!isReadOnly && activeSubTab === 'schedules' && (
          <button
            onClick={() => { resetScheduleForm(); setIsScheduleModalOpen(true); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-sky-500/10"
          >
            <Plus size={16} /> Thiết lập lịch mới
          </button>
        )}
        {!isReadOnly && activeSubTab === 'receipts' && (
          <button
            onClick={() => { resetReceiptForm(); setIsReceiptModalOpen(true); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0e5a6a] hover:bg-[#0a4552] text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-teal-500/10"
          >
            <Plus size={16} /> Lập phiếu bảo trì mới
          </button>
        )}
      </div>

      {/* Search and filter bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm nhanh thiết bị, vị trí, kỹ thuật viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-sky-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-sm"
        />
      </div>

      {/* Content Rendering */}
      <div className="bg-white border border-sky-100 rounded-2xl shadow-sm overflow-hidden p-6">
        
        {/* SUBTAB 1: REQUESTS */}
        {activeSubTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-sky-50 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Danh sách yêu cầu sửa chữa và báo hỏng</h3>
              <span className="text-xs text-slate-500">Màu sắc thể hiện mức độ ưu tiên xử lý thiết bị</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sky-100 text-xs font-semibold text-slate-455 uppercase bg-sky-50/50">
                    <th className="py-3 px-4">Thiết bị báo hỏng</th>
                    <th className="py-3 px-4">Vị trí</th>
                    <th className="py-3 px-4">Mô tả lỗi</th>
                    <th className="py-3 px-4">Độ ưu tiên</th>
                    <th className="py-3 px-4">Người báo</th>
                    <th className="py-3 px-4">Ngày báo</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    {!isReadOnly && <th className="py-3 px-4 text-right no-print">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-sm text-slate-400">Không có yêu cầu báo hỏng nào được tìm thấy.</td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.RequestId} className="border-b border-sky-50 hover:bg-sky-50/20 text-sm text-slate-700">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          <div>
                            <p>{req.MaterialName}</p>
                            <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600">
                              {req.MaterialCode}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-sky-700">{req.Location}</td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-xs" title={req.Description}>{req.Description}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            req.Priority === 'Cao' ? 'bg-red-50 text-red-600 border border-red-100' :
                            req.Priority === 'Trung bình' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-50 text-slate-600 border border-slate-100'
                          }`}>
                            {req.Priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium">{req.ReporterName}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(req.CreatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            req.Status === 'Chờ xử lý' ? 'bg-red-50 text-red-600 animate-pulse' :
                            req.Status === 'Đang sửa' ? 'bg-blue-50 text-blue-600' :
                            req.Status === 'Yêu cầu thanh lý' ? 'bg-purple-50 text-purple-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                            {req.Status}
                          </span>
                        </td>
                        {!isReadOnly && (
                          <td className="py-3.5 px-4 text-right space-x-1.5 no-print">
                            {req.Status === 'Chờ xử lý' && (
                              <button
                                onClick={() => handleUpdateReqStatus(req.RequestId, 'Đang sửa')}
                                className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition-all"
                              >
                                Nhận sửa
                              </button>
                            )}
                            {(req.Status === 'Chờ xử lý' || req.Status === 'Đang sửa') && (
                              <button
                                onClick={() => openReceiptFromRequest(req)}
                                className="px-2 py-1 text-xs bg-[#0e5a6a]/10 hover:bg-[#0e5a6a]/20 text-[#0e5a6a] border border-[#0e5a6a]/20 rounded-lg transition-all font-semibold"
                              >
                                Lập phiếu sửa
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: SCHEDULES */}
        {activeSubTab === 'schedules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-sky-50 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Kế hoạch bảo trì định kỳ cho các thiết bị dùng nhiều lần</h3>
              <span className="text-xs text-slate-500">Tự động tính ngày đến hạn tiếp theo dựa vào Chu kỳ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sky-100 text-xs font-semibold text-slate-455 uppercase bg-sky-50/50">
                    <th className="py-3 px-4">Tên thiết bị</th>
                    <th className="py-3 px-4">Vị trí lắp đặt</th>
                    <th className="py-3 px-4">Chu kỳ bảo trì</th>
                    <th className="py-3 px-4">Lần cuối bảo trì</th>
                    <th className="py-3 px-4">Ngày bảo trì tiếp theo</th>
                    <th className="py-3 px-4">Trạng thái hạn</th>
                    {!isReadOnly && <th className="py-3 px-4 text-right no-print">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-sm text-slate-400">Chưa cài đặt lịch bảo trì định kỳ nào.</td>
                    </tr>
                  ) : (
                    filteredSchedules.map((sch) => {
                      const daysLeft = Math.ceil((new Date(sch.NextMaintenanceDate) - new Date()) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysLeft < 0;
                      
                      return (
                        <tr key={sch.ScheduleId} className="border-b border-sky-50 hover:bg-sky-50/20 text-sm text-slate-700">
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            <div>
                              <p>{sch.MaterialName}</p>
                              <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600">
                                {sch.MaterialCode}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-sky-700">{sch.Location}</td>
                          <td className="py-3.5 px-4 font-medium">{sch.CycleDays} ngày</td>
                          <td className="py-3.5 px-4 text-xs">
                            {sch.LastMaintenanceDate 
                              ? new Date(sch.LastMaintenanceDate).toLocaleDateString('vi-VN') 
                              : <span className="text-slate-400 italic">Chưa từng bảo trì</span>}
                          </td>
                          <td className={`py-3.5 px-4 font-semibold text-xs ${isOverdue ? 'text-red-600' : 'text-slate-655'}`}>
                            {new Date(sch.NextMaintenanceDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-4">
                            {isOverdue ? (
                              <span className="flex items-center gap-1 text-xs text-red-600 font-bold bg-red-55/70 px-2 py-0.5 rounded-full border border-red-100 max-w-fit">
                                <ShieldAlert size={12} /> Quá hạn {Math.abs(daysLeft)} ngày
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 max-w-fit">
                                Còn {daysLeft} ngày
                              </span>
                            )}
                          </td>
                          {!isReadOnly && (
                            <td className="py-3.5 px-4 text-right no-print">
                              <button
                                onClick={() => openReceiptFromSchedule(sch)}
                                className="px-2.5 py-1 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-all shadow-sm"
                              >
                                Lập phiếu bảo trì
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 3: RECEIPTS */}
        {activeSubTab === 'receipts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-sky-50 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Lịch sử phiếu bảo trì & sửa chữa thiết bị</h3>
              <span className="text-xs text-slate-500">Lưu vết chi phí, người sửa và kết quả đánh giá</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sky-100 text-xs font-semibold text-slate-455 uppercase bg-sky-50/50">
                    <th className="py-3 px-4">Tên thiết bị</th>
                    <th className="py-3 px-4">Loại hình</th>
                    <th className="py-3 px-4">Kỹ thuật viên</th>
                    <th className="py-3 px-4">Ngày thực hiện</th>
                    <th className="py-3 px-4">Chi phí</th>
                    <th className="py-3 px-4">Kết quả đánh giá</th>
                    <th className="py-3 px-4">Ghi chú chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-sm text-slate-400">Chưa ghi nhận phiếu bảo trì nào.</td>
                    </tr>
                  ) : (
                    filteredReceipts.map((rec) => (
                      <tr key={rec.ReceiptId} className="border-b border-sky-50 hover:bg-sky-50/20 text-sm text-slate-700">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          <div>
                            <p>{rec.MaterialName}</p>
                            <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600">
                              {rec.MaterialCode}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-xs">
                          <span className={`px-2 py-0.5 rounded-full ${
                            rec.MaintenanceType === 'Bảo trì định kỳ' 
                              ? 'bg-sky-50 text-sky-600 border border-sky-100' 
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {rec.MaintenanceType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{rec.TechnicianName}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(rec.PerformedDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-850">
                          {rec.Cost.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            rec.ResultStatus === 'Hoàn thành tốt' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            rec.ResultStatus === 'Cần theo dõi' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {rec.ResultStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-xs text-slate-500" title={rec.Notes}>{rec.Notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: BÁO HỎNG (REQUEST) */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
          <div className="bg-white border border-sky-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 bg-sky-50/30">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500 animate-pulse" />
                Gửi yêu cầu báo hỏng thiết bị
              </h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle size={14} /> {submitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Thiết bị báo hỏng *</label>
                <select
                  required
                  value={reqMaterialId}
                  onChange={(e) => setReqMaterialId(e.target.value)}
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                >
                  <option value="">-- Chọn thiết bị điện tử --</option>
                  {materials.map(m => (
                    <option key={m.MaVatTu} value={m.MaVatTu}>{m.TenVatTu} ({m.MaCodeVatTu})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Vị trí lắp đặt / Số phòng *</label>
                <input
                  type="text"
                  required
                  value={reqLocation}
                  onChange={(e) => setReqLocation(e.target.value)}
                  placeholder="Ví dụ: Phòng 412, Sảnh chính B..."
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Mức độ ưu tiên *</label>
                <div className="flex gap-4">
                  {['Thấp', 'Trung bình', 'Cao'].map((pri) => (
                    <label key={pri} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="priority" 
                        value={pri} 
                        checked={reqPriority === pri}
                        onChange={() => setReqPriority(pri)}
                        className="text-sky-600 focus:ring-sky-500" 
                      />
                      <span>{pri}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Mô tả chi tiết sự cố hỏng hóc *</label>
                <textarea
                  required
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  placeholder="Mô tả cụ thể hiện trạng (Ví dụ: Ấm đun không vào điện, cháy dây nguồn...)"
                  rows="3"
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 border border-sky-100 hover:bg-slate-50 text-slate-500 rounded-xl text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium shadow-md shadow-red-500/10"
                >
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LỊCH BẢO TRÌ (SCHEDULE) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
          <div className="bg-white border border-sky-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 bg-sky-50/30">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-sky-600" />
                Thiết lập chu kỳ bảo trì thiết bị
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle size={14} /> {submitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Thiết bị thiết lập *</label>
                <select
                  required
                  value={schMaterialId}
                  onChange={(e) => setSchMaterialId(e.target.value)}
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                >
                  <option value="">-- Chọn thiết bị điện tử --</option>
                  {materials.map(m => (
                    <option key={m.MaVatTu} value={m.MaVatTu}>{m.TenVatTu} ({m.MaCodeVatTu})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Vị trí lắp đặt thiết bị *</label>
                <input
                  type="text"
                  required
                  value={schLocation}
                  onChange={(e) => setSchLocation(e.target.value)}
                  placeholder="Ví dụ: Thang máy A1, Sảnh lễ tân..."
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Chu kỳ (Số ngày) *</label>
                  <input
                    type="number"
                    required
                    value={schCycleDays}
                    onChange={(e) => setSchCycleDays(e.target.value)}
                    placeholder="90"
                    min="1"
                    className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Ngày bảo trì tiếp theo *</label>
                  <input
                    type="date"
                    required
                    value={schNextDate}
                    onChange={(e) => setSchNextDate(e.target.value)}
                    className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Ghi chú thiết lập</label>
                <textarea
                  value={schNotes}
                  onChange={(e) => setSchNotes(e.target.value)}
                  placeholder="Thông tin ghi chú về chu kỳ hoặc đặc điểm kỹ thuật..."
                  rows="2"
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 border border-sky-100 hover:bg-slate-50 text-slate-500 rounded-xl text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium shadow-md shadow-sky-500/10"
                >
                  Lưu thiết lập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PHIẾU BẢO TRÌ/SỬA CHỮA (RECEIPT) */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
          <div className="bg-white border border-sky-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 bg-[#0e5a6a]/10">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PenTool size={18} className="text-[#0e5a6a]" />
                Lập phiếu nghiệm thu sửa chữa / bảo trì
              </h3>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
            </div>

            <form onSubmit={handleReceiptSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle size={14} /> {submitError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Loại phiếu *</label>
                  <select
                    value={recType}
                    onChange={(e) => setRecType(e.target.value)}
                    className="w-full bg-slate-50 border border-sky-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                  >
                    <option value="Bảo trì định kỳ">Bảo trì định kỳ</option>
                    <option value="Sửa chữa báo hỏng">Sửa chữa báo hỏng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Mã báo hỏng (nếu có)</label>
                  <input
                    type="text"
                    disabled
                    value={recRequestId ? `Yêu cầu #${recRequestId}` : 'Tự lập phiếu'}
                    className="w-full bg-slate-100 border border-sky-50 rounded-xl px-4 py-2.5 text-sm text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Thiết bị bảo trì *</label>
                <select
                  required
                  disabled={!!recRequestId} // Khóa nếu được kế thừa từ yêu cầu báo hỏng cụ thể
                  value={recMaterialId}
                  onChange={(e) => setRecMaterialId(e.target.value)}
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">-- Chọn thiết bị điện tử --</option>
                  {materials.map(m => (
                    <option key={m.MaVatTu} value={m.MaVatTu}>{m.TenVatTu} ({m.MaCodeVatTu})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Chi phí (đ) *</label>
                  <input
                    type="number"
                    required
                    value={recCost}
                    onChange={(e) => setRecCost(e.target.value)}
                    className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Kỹ thuật viên *</label>
                  <input
                    type="text"
                    required
                    value={recTechName}
                    onChange={(e) => setRecTechName(e.target.value)}
                    placeholder="Tên kỹ thuật viên sửa"
                    className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Kết quả kỹ thuật sau sửa *</label>
                <select
                  value={recResult}
                  onChange={(e) => setRecResult(e.target.value)}
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                >
                  <option value="Hoàn thành tốt">Hoàn thành tốt (Hoạt động bình thường)</option>
                  <option value="Cần theo dõi">Cần theo dõi (Vẫn còn lỗi nhẹ)</option>
                  <option value="Yêu cầu thay thế/Thanh lý">Yêu cầu thay thế/Thanh lý (Hỏng nặng không thể sửa)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase">Nhật ký kỹ thuật / Ghi chú sửa</label>
                <textarea
                  value={recNotes}
                  onChange={(e) => setRecNotes(e.target.value)}
                  placeholder="Ghi nhận lỗi linh kiện đã thay thế, biện pháp khắc phục..."
                  rows="3"
                  className="w-full bg-slate-50 border border-sky-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 border border-sky-100 hover:bg-slate-50 text-slate-500 rounded-xl text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0e5a6a] hover:bg-[#0a4552] text-white rounded-xl text-sm font-medium shadow-md shadow-teal-500/10"
                >
                  Nghiệm thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
