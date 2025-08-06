import { useState, useEffect } from 'react';
import { api } from '@/lib/fetch';
import { APIResult } from '@/types/api';

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface UseRolesResult {
  roles: Role[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * 시스템의 모든 역할을 가져오는 훅
 */
export function useRoles(): UseRolesResult {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.get<APIResult>('/api/admin/roles?includeStats=false&limit=100');
      
      if (data.success && data.data.roles) {
        setRoles(data.data.roles);
      } else {
        setError('역할 목록을 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError('역할 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchRoles();
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return { roles, loading, error, refresh };
}

/**
 * Router용 역할 옵션 포맷터
 */
export function formatRolesForRouter(roles: Role[]) {
  return roles.map(role => ({
    value: role.name,
    label: role.name,
    description: role.description || `${role.name} 권한`
  }));
}

/**
 * Filter용 역할 옵션 포맷터  
 */
export function formatRolesForFilter(roles: Role[]) {
  return [
    { value: '', label: '모든 역할' },
    ...roles.map(role => ({
      value: role.name,
      label: role.name
    }))
  ];
}