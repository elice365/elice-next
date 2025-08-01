"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface UserRoleManagerProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface RoleResponse {
  userRoles: Role[];
  availableRoles: Role[];
}

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({ userId, isOpen, onClose, onUpdate }) => {
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 사용자 역할 정보 조회
  const fetchUserRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<APIResult<RoleResponse>>(`/api/admin/users/${userId}/roles`);
      
      if (data.success && data.data) {
        setUserRoles(data.data.userRoles);
        setAvailableRoles(data.data.availableRoles);
      }
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  // 역할 추가
  const handleAddRole = async (roleId: string) => {
    setActionLoading(roleId);
    try {
      const { data } = await api.post<APIResult>(`/api/admin/users/${userId}/roles`, {
        roleId
      });

      if (data.success) {
        await fetchUserRoles();
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to add role:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // 역할 제거
  const handleRemoveRole = async (roleId: string) => {
    setActionLoading(roleId);
    try {
      const { data } = await api.delete<APIResult>(`/api/admin/users/${userId}/roles`, {
        data: { roleId }
      });

      if (data.success) {
        await fetchUserRoles();
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to remove role:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // 사용자가 해당 역할을 가지고 있는지 확인
  const hasRole = (roleId: string) => {
    return userRoles.some((ur: Role) => ur.id === roleId);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[var(--color-modal)] rounded-lg p-6 w-full max-w-md">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-modal)] rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[var(--title)]">역할 관리</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-color)] hover:text-[var(--hover-text)] p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2 text-green-600 dark:text-green-400">
              현재 역할 ({userRoles.length}개)
            </h3>
            {userRoles.length > 0 ? (
              <div className="space-y-2">
                {userRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800"
                  >
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">
                        {role.name}
                      </div>
                      {role.description && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          {role.description}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveRole(role.id)}
                      disabled={actionLoading === role.id}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-[var(--hover-danger)] disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === role.id ? '제거 중...' : '제거'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--text-color)] opacity-70 text-sm">
                할당된 역할이 없습니다.
              </p>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2 text-blue-600 dark:text-blue-400">
              사용 가능한 역할
            </h3>
            <div className="space-y-2">
              {availableRoles
                .filter(role => !hasRole(role.id))
                .map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-[var(--border-color)]  dark:border-blue-800"
                  >
                    <div>
                      <div className="font-medium text-blue-800 dark:text-blue-200">
                        {role.name}
                      </div>
                      {role.description && (
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          {role.description}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddRole(role.id)}
                      disabled={actionLoading === role.id}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-[var(--hover-primary)] disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === role.id ? '추가 중...' : '추가'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 mt-6 border-t border-[var(--modal-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};