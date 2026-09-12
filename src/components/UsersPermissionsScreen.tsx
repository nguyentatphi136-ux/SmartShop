import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Search,
  Check,
  X,
  Lock,
  Building2,
  Mail,
  Phone,
  KeyRound,
  Edit2,
  Trash2,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { StaffUser } from '../types';
import { useLanguage } from '../utils/i18n';
import {
  PERMISSION_MODULES,
  RolePermissionsMatrix,
  RoleType,
  getRoleDetails,
} from '../utils/permissions';

interface UsersPermissionsScreenProps {
  staffList: StaffUser[];
  onAddStaff?: (newStaff: Omit<StaffUser, 'id'>) => void;
  onUpdateStaff?: (staff: StaffUser) => void;
  onDeleteStaff?: (staffId: string) => void;
  onImpersonateStaff?: (staff: StaffUser) => void;
  currentUser?: StaffUser | null;
  rolePermissions: RolePermissionsMatrix;
  onUpdateRolePermissions?: (matrix: RolePermissionsMatrix) => void;
  onResetRolePermissions?: () => void;
  isDark?: boolean;
}

export const UsersPermissionsScreen: React.FC<UsersPermissionsScreenProps> = ({
  staffList,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onImpersonateStaff,
  currentUser,
  rolePermissions,
  onUpdateRolePermissions,
  onResetRolePermissions,
  isDark,
}) => {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | RoleType>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffUser | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Form states for Add Staff
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<RoleType>('cashier');
  const [newStaffBranch, setNewStaffBranch] = useState('Cửa hàng chính');
  const [formError, setFormError] = useState<string | null>(null);

  // Filter staff members
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phone.includes(searchQuery);
    const matchesRole = selectedRoleFilter === 'all' || staff.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = staffList.filter((s) => s.status === 'active').length;

  const handleOpenAddModal = () => {
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setNewStaffRole('cashier');
    setNewStaffBranch('Cửa hàng chính');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmitAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = newStaffName.trim();
    const cleanEmail = newStaffEmail.trim().toLowerCase();
    const cleanPhone = newStaffPhone.trim();

    if (!cleanName) {
      setFormError('Vui lòng nhập họ và tên nhân viên');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Vui lòng nhập địa chỉ email hợp lệ để đăng nhập OTP');
      return;
    }
    if (staffList.some((s) => s.email.toLowerCase() === cleanEmail)) {
      setFormError(`Email "${cleanEmail}" đã được sử dụng bởi một nhân sự khác!`);
      return;
    }

    if (onAddStaff) {
      onAddStaff({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone || '0909 *** ***',
        role: newStaffRole,
        status: 'active',
        branch: newStaffBranch,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleTogglePermission = (role: RoleType, moduleKey: string) => {
    if (role === 'admin') return; // Admin permissions cannot be turned off
    if (!onUpdateRolePermissions) return;

    const currentVal = rolePermissions[role]?.[moduleKey] ?? false;
    const updated = {
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        [moduleKey]: !currentVal,
      },
    };

    onUpdateRolePermissions(updated);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {t.usersTitle}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {staffList.length} {language === 'vi' ? 'nhân sự' : 'staff'} ({activeCount} {language === 'vi' ? 'hoạt động' : 'active'})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'vi'
                  ? 'Quản lý danh sách nhân viên, gán vai trò và tùy chỉnh ma trận phân quyền truy cập chức năng hệ thống'
                  : 'Manage staff accounts, assign business roles, and customize role-based permissions (RBAC)'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onResetRolePermissions && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs'
              }`}
              title="Khôi phục ma trận phân quyền về mặc định"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'vi' ? 'Khôi phục mặc định' : 'Reset RBAC'}</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addStaff}</span>
          </button>
        </div>
      </div>

      {/* Role Summary Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['admin', 'manager', 'cashier', 'inventory_staff'] as RoleType[]).map((r) => {
          const details = getRoleDetails(r, language);
          const count = staffList.filter((s) => s.role === r).length;
          const allowedModulesCount = PERMISSION_MODULES.filter(
            (m) => rolePermissions[r]?.[m.key]
          ).length;

          return (
            <div
              key={r}
              className={`p-3.5 rounded-2xl border transition-all ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${details.badgeColor}`}>
                  {details.shortLabel}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {count} {language === 'vi' ? 'người' : 'users'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {details.description}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{language === 'vi' ? 'Quyền truy cập:' : 'Permissions:'}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {allowedModulesCount}/{PERMISSION_MODULES.length} {language === 'vi' ? 'chức năng' : 'modules'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Table Card */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchStaffPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: t.allRoles },
                { id: 'admin', label: 'Chủ cửa hàng' },
                { id: 'manager', label: 'Quản lý' },
                { id: 'cashier', label: 'Thu ngân' },
                { id: 'inventory_staff', label: 'Kho' },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoleFilter(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedRoleFilter === r.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead
              className={`border-b text-[11px] uppercase font-bold tracking-wider ${
                isDark ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <tr>
                <th className="py-3.5 px-4">{t.staffMember}</th>
                <th className="py-3.5 px-4">{t.contact}</th>
                <th className="py-3.5 px-4">{t.systemRole}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Cơ sở làm việc' : 'Workplace'}</th>
                <th className="py-3.5 px-4 text-center">{t.status}</th>
                <th className="py-3.5 px-4 text-center">{language === 'vi' ? 'Thao tác & Thử nghiệm' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.map((staff) => {
                const roleDetails = getRoleDetails(staff.role, language);
                const isCurrentLoggedIn = currentUser?.email.toLowerCase() === staff.email.toLowerCase();

                return (
                  <tr
                    key={staff.id}
                    className={`group transition-colors ${
                      isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold flex items-center justify-center text-xs relative flex-shrink-0">
                          {staff.name.charAt(0).toUpperCase()}
                          {staff.status === 'active' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute -bottom-0.5 -right-0.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                              {staff.name}
                            </p>
                            {isCurrentLoggedIn && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {language === 'vi' ? 'Bạn' : 'You'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">ID: {staff.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{staff.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{staff.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleDetails.badgeColor}`}>
                        {roleDetails.shortLabel}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {staff.branch}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (onUpdateStaff) {
                            onUpdateStaff({
                              ...staff,
                              status: staff.status === 'active' ? 'inactive' : 'active',
                            });
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
                          staff.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800/50 hover:bg-rose-200'
                        }`}
                        title={language === 'vi' ? 'Nhấn để bật/khóa tài khoản' : 'Click to toggle active status'}
                      >
                        {staff.status === 'active' ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>{t.active}</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            <span>{language === 'vi' ? 'Đã khóa' : 'Locked'}</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Role & Details */}
                        <button
                          onClick={() => setEditingStaff(staff)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                          title="Chỉnh sửa thông tin & đổi vai trò"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Test / Impersonate role */}
                        {onImpersonateStaff && (
                          <button
                            onClick={() => onImpersonateStaff(staff)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-all flex items-center gap-1"
                            title={`Đăng nhập thử vai trò ${roleDetails.shortLabel} (${staff.name})`}
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            <span className="hidden xl:inline">{language === 'vi' ? 'Thử vai trò' : 'Test role'}</span>
                          </button>
                        )}

                        {/* Delete Staff */}
                        {onDeleteStaff && staff.id !== 'user-1' && staff.email !== currentUser?.email && (
                          <button
                            onClick={() => setDeletingStaff(staff)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Xóa nhân viên khỏi hệ thống"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive RBAC Permissions Matrix */}
      <div
        className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Ma trận Phân quyền Chức năng (RBAC Matrix)' : 'Interactive RBAC Permissions Matrix'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {language === 'vi' ? 'Tự động áp dụng' : 'Live Sync'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'vi'
                  ? 'Chủ cửa hàng có thể bật/tắt quyền cho từng vai trò ngay tại đây. Thay đổi sẽ có hiệu lực ngay lập tức trên thanh Menu và các màn hình!'
                  : 'Toggle checkboxes below to instantly grant or revoke permissions for each role across the app.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-500" />
              <span>Admin cố định 100%</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-xl border-slate-100 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead
              className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'bg-slate-800/60 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <tr>
                <th className="py-3 px-4 min-w-[240px]">{t.functionalModule}</th>
                <th className="py-3 px-3 text-center min-w-[120px]">
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                    Chủ cửa hàng (Admin)
                  </span>
                </th>
                <th className="py-3 px-3 text-center min-w-[120px]">
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                    Quản lý (Manager)
                  </span>
                </th>
                <th className="py-3 px-3 text-center min-w-[120px]">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    Thu ngân (Cashier)
                  </span>
                </th>
                <th className="py-3 px-3 text-center min-w-[120px]">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                    Nhân viên Kho
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PERMISSION_MODULES.map((module) => {
                return (
                  <tr
                    key={module.key}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">
                          {module.nameVi}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                          {module.descriptionVi}
                        </p>
                      </div>
                    </td>

                    {/* Admin: Always True & Locked */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </td>

                    {/* Manager: Interactive */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleTogglePermission('manager', module.key)}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all cursor-pointer ${
                          rolePermissions.manager?.[module.key]
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 hover:bg-rose-100 hover:text-rose-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
                        }`}
                        title="Nhấn để bật/tắt quyền cho Quản lý"
                      >
                        {rolePermissions.manager?.[module.key] ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Cashier: Interactive */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleTogglePermission('cashier', module.key)}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all cursor-pointer ${
                          rolePermissions.cashier?.[module.key]
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 hover:bg-rose-100 hover:text-rose-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
                        }`}
                        title="Nhấn để bật/tắt quyền cho Thu ngân"
                      >
                        {rolePermissions.cashier?.[module.key] ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Inventory Staff: Interactive */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleTogglePermission('inventory_staff', module.key)}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all cursor-pointer ${
                          rolePermissions.inventory_staff?.[module.key]
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 hover:bg-rose-100 hover:text-rose-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
                        }`}
                        title="Nhấn để bật/tắt quyền cho Nhân viên Kho"
                      >
                        {rolePermissions.inventory_staff?.[module.key] ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Thêm nhân viên mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Thêm tài khoản nhân viên mới</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nhân viên có thể dùng Email này để nhận mã OTP và đăng nhập vào hệ thống
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên nhân viên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Thị Mai"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email đăng nhập (OTP) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="mai.le@smartsale.ai"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    placeholder="0912 345 678"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vai trò hệ thống *
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as RoleType)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="cashier">Thu ngân (Cashier - Bán hàng POS)</option>
                    <option value="inventory_staff">Nhân viên Kho (Inventory Staff)</option>
                    <option value="manager">Quản lý cửa hàng (Manager)</option>
                    <option value="admin">Chủ cửa hàng (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cơ sở làm việc
                  </label>
                  <input
                    type="text"
                    value={newStaffBranch}
                    onChange={(e) => setNewStaffBranch(e.target.value)}
                    placeholder="Cửa hàng chính"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Role preview explanation */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Phạm vi vai trò {getRoleDetails(newStaffRole, language).label}:
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  {getRoleDetails(newStaffRole, language).description}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Thêm nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa nhân viên & Phân quyền */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <button
              onClick={() => setEditingStaff(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Chỉnh sửa thông tin & Vai trò</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cập nhật phân quyền và trạng thái hoạt động của nhân viên #{editingStaff.id}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên nhân viên
                </label>
                <input
                  type="text"
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email đăng nhập OTP
                  </label>
                  <input
                    type="email"
                    value={editingStaff.email}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editingStaff.phone}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vai trò phân quyền
                  </label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as RoleType })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="admin">Chủ cửa hàng (Admin)</option>
                    <option value="manager">Quản lý (Manager)</option>
                    <option value="cashier">Thu ngân (Cashier)</option>
                    <option value="inventory_staff">Nhân viên Kho (Inventory)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Trạng thái tài khoản
                  </label>
                  <select
                    value={editingStaff.status}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, status: e.target.value as 'active' | 'inactive' })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="active">Hoạt động bình thường</option>
                    <option value="inactive">Đã khóa truy cập</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cơ sở làm việc
                </label>
                <input
                  type="text"
                  value={editingStaff.branch}
                  onChange={(e) => setEditingStaff({ ...editingStaff, branch: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateStaff && editingStaff) {
                      onUpdateStaff(editingStaff);
                    }
                    setEditingStaff(null);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa nhân viên */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Xác nhận xóa nhân viên?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hành động này sẽ thu hồi toàn bộ quyền truy cập của tài khoản này
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{deletingStaff.name}</strong> ({deletingStaff.email})?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingStaff(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (onDeleteStaff && deletingStaff) {
                    onDeleteStaff(deletingStaff.id);
                  }
                  setDeletingStaff(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 active:scale-95 transition-all"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận khôi phục ma trận mặc định */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-4 text-blue-600">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Khôi phục phân quyền mặc định</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thiết lập lại ma trận quyền theo chuẩn nghiệp vụ bán lẻ
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              Ma trận phân quyền của Quản lý, Thu ngân và Nhân viên kho sẽ được đưa về giá trị chuẩn ban đầu. Bạn có muốn tiếp tục?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (onResetRolePermissions) {
                    onResetRolePermissions();
                  }
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
