"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Key,
  Mail,
  Users,
  UserPlus,
  Shield,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Image,
  Lock,
} from "lucide-react";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  getUserPermissions,
  type UserPermissions,
} from "@/lib/permissions";

interface UserData {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  permissions: string | null;
  createdAt: string;
  updatedAt: string;
}

const roleLabels: Record<string, string> = {
  admin: "管理员",
  staff: "运营",
  viewer: "访客",
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";
  const currentAvatar = (session?.user as any)?.avatar || "";
  const currentName = session?.user?.name || "";

  const [activeTab, setActiveTab] = useState<string>("profile");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 个人资料
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  // 修改密码
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 修改邮箱
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // 创建用户
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState("staff");

  // 用户管理
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // 权限管理
  const [permissionUserId, setPermissionUserId] = useState<number | null>(null);
  const [permissionsState, setPermissionsState] = useState<UserPermissions | null>(null);
  const [permissionsDirty, setPermissionsDirty] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // 初始化个人资料表单
  useEffect(() => {
    setProfileName(currentName);
    setProfileAvatar(currentAvatar);
    setAvatarPreview(currentAvatar);
  }, [currentName, currentAvatar]);

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("加载用户列表失败:", err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && (activeTab === "users" || activeTab === "permissions")) {
      loadUsers();
    }
  }, [isAdmin, activeTab, loadUsers]);

  // 选中权限管理目标用户
  const selectPermissionUser = (user: UserData) => {
    setPermissionUserId(user.id);
    const perms = getUserPermissions(user.role, user.permissions);
    setPermissionsState(perms);
    setPermissionsDirty(false);
  };

  // 切换单个权限
  const togglePermission = (key: keyof UserPermissions) => {
    if (!permissionsState) return;
    setPermissionsState({ ...permissionsState, [key]: !permissionsState[key] });
    setPermissionsDirty(true);
  };

  // 保存权限
  const handleSavePermissions = async () => {
    if (!permissionUserId || !permissionsState || !permissionsDirty) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${permissionUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionsState }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", "权限已更新");
        setPermissionsDirty(false);
        loadUsers();
      } else {
        showMessage("error", data.error);
      }
    } catch {
      showMessage("error", "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 更新个人资料
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, avatar: profileAvatar }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", "个人资料已更新，重新登录后生效");
      } else {
        showMessage("error", data.error);
      }
    } catch {
      showMessage("error", "更新失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      showMessage("error", "两次密码输入不一致");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", data.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showMessage("error", data.error);
      }
    } catch {
      showMessage("error", "修改失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 修改邮箱
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/update-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, password: emailPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", data.message);
        if (data.message?.includes("重新登录")) {
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        }
        setNewEmail("");
        setEmailPassword("");
      } else {
        showMessage("error", data.error);
      }
    } catch {
      showMessage("error", "修改失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 创建用户
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          name: createName,
          role: createRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", `用户 ${data.user.email} 创建成功`);
        setCreateEmail("");
        setCreatePassword("");
        setCreateName("");
        setCreateRole("staff");
        if (activeTab === "users") loadUsers();
      } else {
        showMessage("error", data.error);
      }
    } catch {
      showMessage("error", "创建失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 更新用户角色
  const handleRoleChange = async (userId: number, role: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", "角色已更新");
        loadUsers();
      } else {
        showMessage("error", data.error);
      }
    } catch {
      showMessage("error", "更新失败");
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: number) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", data.message);
        loadUsers();
        setDeleteConfirm(null);
      } else {
        showMessage("error", data.error);
      }
    } catch {
      showMessage("error", "删除失败");
    }
  };

  const tabs = [
    { id: "profile", label: "个人资料", icon: User },
    { id: "password", label: "修改密码", icon: Key },
    { id: "email", label: "绑定邮箱", icon: Mail },
    ...(isAdmin
      ? [
          { id: "create", label: "创建用户", icon: UserPlus },
          { id: "users", label: "用户管理", icon: Users },
          { id: "permissions", label: "权限管理", icon: Lock },
        ]
      : []),
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #b45309, #92400e)" }}
          >
            <Settings size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
            系统设置
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--ink-light)", marginLeft: 48 }}>
          管理您的账号安全与系统用户
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1.5 shadow-sm border border-[var(--border)] flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setMessage(null);
              setDeleteConfirm(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? "#f0e6d8" : "transparent",
              color: activeTab === tab.id ? "#b45309" : "var(--ink-light)",
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-8">
        {/* 个人资料 */}
        {activeTab === "profile" && (
          <form onSubmit={handleUpdateProfile} className="max-w-md space-y-5">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--ink)" }}>
              个人资料
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--ink-light)" }}>
              当前账号：{session?.user?.email}
            </p>

            {/* 头像 */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                头像
              </label>
              <div className="flex items-center gap-4 mb-2">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="头像预览"
                    className="w-16 h-16 rounded-xl object-cover border"
                    style={{ borderColor: "var(--border)" }}
                    onError={() => setAvatarPreview("")}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #b45309, #92400e)" }}
                  >
                    {(session?.user?.name || session?.user?.email || "A").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <input
                type="url"
                value={profileAvatar}
                onChange={(e) => {
                  setProfileAvatar(e.target.value);
                  setAvatarPreview(e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none"
                style={{ borderColor: "var(--border)", background: "#faf8f5" }}
                placeholder="输入头像图片 URL"
                onFocus={(e) => (e.target.style.borderColor = "#b45309")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <p className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>
                粘贴图片链接作为头像
              </p>
            </div>

            {/* 姓名 */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                用户名
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none"
                style={{ borderColor: "var(--border)", background: "#faf8f5" }}
                placeholder="请输入用户名"
                onFocus={(e) => (e.target.style.borderColor = "#b45309")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #b45309, #92400e)" }}
            >
              {submitting ? "保存中…" : "保存资料"}
            </button>
          </form>
        )}

        {/* 修改密码 */}
        {activeTab === "password" && (
          <form onSubmit={handleChangePassword} className="max-w-md space-y-5">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--ink)" }}>
              修改登录密码
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--ink-light)" }}>
              当前账号：{session?.user?.email}
            </p>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                当前密码
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none"
                style={{ borderColor: "var(--border)", background: "#faf8f5" }}
                placeholder="请输入当前密码"
                onFocus={(e) => (e.target.style.borderColor = "#b45309")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                新密码
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none"
                style={{ borderColor: "var(--border)", background: "#faf8f5" }}
                placeholder="至少6位"
                onFocus={(e) => (e.target.style.borderColor = "#b45309")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                确认新密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none"
                style={{ borderColor: "var(--border)", background: "#faf8f5" }}
                placeholder="再次输入新密码"
                onFocus={(e) => (e.target.style.borderColor = "#b45309")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #b45309, #92400e)" }}
            >
              {submitting ? "保存中…" : "更新密码"}
            </button>
          </form>
        )}

        {/* 绑定邮箱 */}
        {activeTab === "email" && (
          <form onSubmit={handleUpdateEmail} className="max-w-md space-y-5">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--ink)" }}>
              修改绑定邮箱
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--ink-light)" }}>
              当前邮箱：{session?.user?.email}
            </p>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                新邮箱地址
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none"
                style={{ borderColor: "var(--border)", background: "#faf8f5" }}
                placeholder="请输入新邮箱"
                onFocus={(e) => (e.target.style.borderColor = "#b45309")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                当前密码（验证身份）
              </label>
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none"
                style={{ borderColor: "var(--border)", background: "#faf8f5" }}
                placeholder="请输入密码确认身份"
                onFocus={(e) => (e.target.style.borderColor = "#b45309")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #b45309, #92400e)" }}
            >
              {submitting ? "保存中…" : "更新邮箱"}
            </button>
          </form>
        )}

        {/* 创建用户（管理员） */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateUser} className="max-w-md space-y-5">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--ink)" }}>
              创建新用户
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--ink-light)" }}>
              为新成员创建系统账号
            </p>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                邮箱 *
              </label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none"
                style={{ borderColor: "var(--border)", background: "#faf8f5" }}
                placeholder="请输入邮箱"
                onFocus={(e) => (e.target.style.borderColor = "#b45309")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                姓名
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none"
                style={{ borderColor: "var(--border)", background: "#faf8f5" }}
                placeholder="选填"
                onFocus={(e) => (e.target.style.borderColor = "#b45309")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                初始密码 *
              </label>
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none"
                style={{ borderColor: "var(--border)", background: "#faf8f5" }}
                placeholder="至少6位"
                onFocus={(e) => (e.target.style.borderColor = "#b45309")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                角色
              </label>
              <div className="flex gap-2">
                {["admin", "staff", "viewer"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCreateRole(r)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all border"
                    style={{
                      background: createRole === r ? "#f0e6d8" : "white",
                      color: createRole === r ? "#b45309" : "var(--ink-light)",
                      borderColor: createRole === r ? "#b45309" : "var(--border)",
                    }}
                  >
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #b45309, #92400e)" }}
            >
              {submitting ? "创建中…" : "创建用户"}
            </button>
          </form>
        )}

        {/* 用户管理（管理员） */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--ink)" }}>
              用户管理
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--ink-light)" }}>
              管理系统中的所有用户账号
            </p>

            {usersLoading ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--ink-light)" }}>
                加载中…
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#faf8f5", borderBottom: "1px solid var(--border)" }}>
                      <th className="text-left p-3 font-medium" style={{ color: "var(--ink-light)" }}>
                        用户
                      </th>
                      <th className="text-left p-3 font-medium" style={{ color: "var(--ink-light)" }}>
                        角色
                      </th>
                      <th className="text-left p-3 font-medium" style={{ color: "var(--ink-light)" }}>
                        创建时间
                      </th>
                      <th className="text-right p-3 font-medium" style={{ color: "var(--ink-light)" }}>
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        style={{ borderBottom: "1px solid #f0ebe0" }}
                        className="hover:bg-[#faf8f5] transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt="头像"
                                className="w-8 h-8 rounded-lg object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                                style={{
                                  background:
                                    user.role === "admin"
                                      ? "linear-gradient(135deg, #b45309, #92400e)"
                                      : user.role === "staff"
                                      ? "linear-gradient(135deg, #6b7280, #4b5563)"
                                      : "linear-gradient(135deg, #9ca3af, #d1d5db)",
                                }}
                              >
                                {user.role === "admin" ? (
                                  <Shield size={14} />
                                ) : (
                                  (user.name || user.email || "U").charAt(0).toUpperCase()
                                )}
                              </div>
                            )}
                            <div>
                              <p className="font-medium" style={{ color: "var(--ink)" }}>
                                {user.name || "未命名"}
                              </p>
                              <p className="text-xs" style={{ color: "var(--ink-light)" }}>
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-xs px-2 py-1 rounded-md border"
                            style={{
                              borderColor: "var(--border)",
                              background: "#faf8f5",
                              color: "var(--ink)",
                            }}
                          >
                            <option value="admin">管理员</option>
                            <option value="staff">运营</option>
                            <option value="viewer">访客</option>
                          </select>
                        </td>
                        <td className="p-3 text-xs" style={{ color: "var(--ink-light)" }}>
                          {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="p-3 text-right">
                          {deleteConfirm === user.id ? (
                            <div className="flex items-center gap-1 justify-end">
                              <span className="text-xs text-red-600 mr-1">确认删除？</span>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-1.5 rounded-md bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="删除用户"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-sm" style={{ color: "var(--ink-light)" }}>
                          暂无用户数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 权限管理（管理员） */}
        {activeTab === "permissions" && (
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--ink)" }}>
              权限管理
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--ink-light)" }}>
              选择用户以管理其细粒度权限。管理员角色拥有所有权限且不可降级。
            </p>

            <div className="flex gap-6">
              {/* 用户列表 */}
              <div className="w-56 flex-shrink-0">
                <h3 className="text-xs font-medium mb-2" style={{ color: "var(--ink-light)" }}>
                  选择用户
                </h3>
                {usersLoading ? (
                  <p className="text-xs" style={{ color: "var(--ink-light)" }}>加载中…</p>
                ) : (
                  <div className="space-y-1">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => selectPermissionUser(user)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                        style={{
                          background: permissionUserId === user.id ? "#f0e6d8" : "transparent",
                          color: permissionUserId === user.id ? "#b45309" : "var(--ink)",
                        }}
                      >
                        <span className="block font-medium truncate">{user.name || user.email}</span>
                        <span className="text-xs" style={{ color: "var(--ink-light)" }}>
                          {roleLabels[user.role] || user.role}
                          {user.role === "admin" && (
                            <span className="ml-1 text-xs" style={{ color: "var(--ink-light)" }}>
                              (全部权限)
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 权限编辑区 */}
              <div className="flex-1" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 24 }}>
                {!permissionUserId ? (
                  <div className="text-center py-12" style={{ color: "var(--ink-light)" }}>
                    <Lock size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">请从左侧选择要管理权限的用户</p>
                  </div>
                ) : permissionsState ? (
                  <div>
                    <h3 className="text-sm font-medium mb-4" style={{ color: "var(--ink)" }}>
                      为 {users.find((u) => u.id === permissionUserId)?.name || "用户"} 配置权限
                    </h3>

                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.name} className="mb-5">
                        <h4
                          className="text-xs font-medium mb-2 pb-1"
                          style={{
                            color: "var(--ink-light)",
                            borderBottom: "1px solid #f0ebe0",
                          }}
                        >
                          {group.name}
                        </h4>
                        <div className="space-y-2">
                          {group.keys.map((key) => (
                            <label
                              key={key}
                              className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-[#faf8f5]"
                            >
                              <input
                                type="checkbox"
                                checked={permissionsState[key]}
                                disabled={
                                  users.find((u) => u.id === permissionUserId)?.role === "admin"
                                }
                                onChange={() => togglePermission(key)}
                                className="w-4 h-4 rounded accent-[#b45309]"
                              />
                              <span className="text-sm" style={{ color: "var(--ink)" }}>
                                {PERMISSION_LABELS[key]}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                      <button
                        onClick={handleSavePermissions}
                        disabled={submitting || !permissionsDirty}
                        className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg, #b45309, #92400e)" }}
                      >
                        {submitting ? "保存中…" : "保存权限"}
                      </button>
                      {permissionsDirty && (
                        <span className="text-xs text-amber-600">有未保存的更改</span>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
