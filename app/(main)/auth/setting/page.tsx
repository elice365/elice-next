'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/stores';
import { api } from '@/lib/fetch';
import type { APIResult } from '@/types/api';
import { Icon } from '@/components/ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';

// Tab types
type SettingTab = 'profile' | 'password' | 'notifications' | 'privacy' | 'account';

// Settings interfaces
interface UserProfile {
  name: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
  imageUrl?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  commentNotifications: boolean;
  likeNotifications: boolean;
  followNotifications: boolean;
}

interface PrivacySettings {
  profilePublic: boolean;
  showEmail: boolean;
  showActivity: boolean;
  allowMessages: boolean;
}

const tabAnimationVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function SettingPage() {
  const t = useTranslations('settings');
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  
  const [activeTab, setActiveTab] = useState<SettingTab>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phoneNumber: '',
    bio: '',
    imageUrl: ''
  });
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    commentNotifications: true,
    likeNotifications: true,
    followNotifications: true
  });
  
  // Privacy settings state
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profilePublic: true,
    showEmail: false,
    showActivity: true,
    allowMessages: true
  });

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      // Load user settings
      loadUserSettings();
    }
  }, [user, router]);

  const loadUserSettings = async () => {
    try {
      const response = await api.get<APIResult<any>>('/api/user/settings');
      if (response.data.success) {
        const settings = response.data.data;
        setProfile({
          name: settings.name || user?.name || '',
          email: settings.email || user?.email || '',
          phoneNumber: settings.phoneNumber || '',
          bio: settings.bio || '',
          imageUrl: settings.imageUrl || ''
        });
        if (settings.notifications) {
          setNotifications(settings.notifications);
        }
        if (settings.privacy) {
          setPrivacy(settings.privacy);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const response = await api.put<APIResult>('/api/user/profile', profile);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: t('profileUpdated') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('updateFailed') });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: t('passwordMismatch') });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: t('passwordTooShort') });
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      const response = await api.post<APIResult>('/api/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: t('passwordChanged') });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('passwordChangeFailed') });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const response = await api.put<APIResult>('/api/user/notifications', notifications);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: t('notificationsUpdated') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('updateFailed') });
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const response = await api.put<APIResult>('/api/user/privacy', privacy);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: t('privacyUpdated') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('updateFailed') });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('deleteAccountConfirm'))) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.delete<APIResult>('/api/user/account');
      
      if (response.data.success) {
        router.push('/');
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('deleteFailed') });
      setLoading(false);
    }
  };

  const tabs: { id: SettingTab; label: string; icon: string }[] = [
    { id: 'profile', label: t('profile'), icon: 'User' },
    { id: 'password', label: t('password'), icon: 'Lock' },
    { id: 'notifications', label: t('notifications'), icon: 'Bell' },
    { id: 'privacy', label: t('privacy'), icon: 'Shield' },
    { id: 'account', label: t('account'), icon: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--title)] mb-2">
              {t('title')}
            </h1>
            <p className="text-[var(--text-color)] opacity-80">
              {t('subtitle')}
            </p>
          </motion.div>
          
          {/* Main Content Container */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Sidebar Tabs */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
                <nav className="p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group mb-1 ${
                        activeTab === tab.id
                          ? 'bg-[var(--blog-accent)] text-white shadow-sm'
                          : 'hover:bg-[var(--selecter)] text-[var(--text-color)]'
                      }`}
                    >
                      <Icon 
                        name={tab.icon as any} 
                        size={18} 
                        className={activeTab === tab.id ? 'text-white' : 'text-[var(--text-color)] opacity-60 group-hover:opacity-100'}
                      />
                      <span className="font-medium">{tab.label}</span>
                      {activeTab === tab.id && (
                        <Icon name="ChevronRight" size={16} className="ml-auto" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {/* Message */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                      message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    <Icon 
                      name={message.type === 'success' ? 'CheckCircle' : 'AlertCircle'} 
                      size={20}
                    />
                    <span className="flex-1">{message.text}</span>
                    <button
                      onClick={() => setMessage(null)}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Icon name="X" size={18} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    variants={tabAnimationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 sm:p-8"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--title)] mb-6 flex items-center gap-2">
                      <Icon name="User" size={24} className="text-[var(--blog-accent)]" />
                      {t('profileSettings')}
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Profile Image */}
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-[var(--selecter)] flex items-center justify-center">
                          {profile.imageUrl ? (
                            <img src={profile.imageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Icon name="User" size={32} className="text-[var(--text-color)] opacity-40" />
                          )}
                        </div>
                        <div>
                          <button className="px-4 py-2 bg-[var(--blog-accent)] text-white rounded-lg hover:bg-[var(--blog-accent-hover)] transition-colors text-sm font-medium">
                            {t('changePhoto')}
                          </button>
                          <p className="text-xs text-[var(--text-color)] opacity-60 mt-2">
                            {t('photoHint')}
                          </p>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-[var(--title)] mb-2">
                            {t('name')}
                          </label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--blog-accent)] focus:border-transparent outline-none transition-all text-[var(--text-color)]"
                            placeholder={t('enterName')}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[var(--title)] mb-2">
                            {t('email')}
                          </label>
                          <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="w-full px-4 py-3 bg-[var(--selecter)] border border-[var(--border-color)] rounded-lg text-[var(--text-color)] opacity-60 cursor-not-allowed"
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[var(--title)] mb-2">
                            {t('phone')}
                          </label>
                          <input
                            type="tel"
                            value={profile.phoneNumber}
                            onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--blog-accent)] focus:border-transparent outline-none transition-all text-[var(--text-color)]"
                            placeholder={t('enterPhone')}
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[var(--title)] mb-2">
                            {t('bio')}
                          </label>
                          <textarea
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--blog-accent)] focus:border-transparent outline-none transition-all text-[var(--text-color)] resize-none"
                            placeholder={t('enterBio')}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={handleProfileUpdate}
                          disabled={loading}
                          className="px-6 py-3 bg-[var(--blog-accent)] text-white rounded-lg hover:bg-[var(--blog-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {t('saving')}
                            </>
                          ) : (
                            <>
                              <Icon name="Check" size={18} />
                              {t('save')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                  <motion.div
                    key="password"
                    variants={tabAnimationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 sm:p-8"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--title)] mb-6 flex items-center gap-2">
                      <Icon name="Lock" size={24} className="text-[var(--blog-accent)]" />
                      {t('passwordSettings')}
                    </h2>
                    
                    <div className="max-w-md space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[var(--title)] mb-2">
                          {t('currentPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--blog-accent)] focus:border-transparent outline-none transition-all text-[var(--text-color)] pr-10"
                            placeholder="••••••••"
                          />
                          <Icon name="Key" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-color)] opacity-40" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[var(--title)] mb-2">
                          {t('newPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--blog-accent)] focus:border-transparent outline-none transition-all text-[var(--text-color)] pr-10"
                            placeholder="••••••••"
                          />
                          <Icon name="Lock" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-color)] opacity-40" />
                        </div>
                        <p className="text-xs text-[var(--text-color)] opacity-60 mt-2">
                          {t('passwordHint')}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[var(--title)] mb-2">
                          {t('confirmPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--blog-accent)] focus:border-transparent outline-none transition-all text-[var(--text-color)] pr-10"
                            placeholder="••••••••"
                          />
                          <Icon name="CheckCircle" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-color)] opacity-40" />
                        </div>
                      </div>
                      
                      <button
                        onClick={handlePasswordChange}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-[var(--blog-accent)] text-white rounded-lg hover:bg-[var(--blog-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t('changing')}
                          </>
                        ) : (
                          <>
                            <Icon name="Shield" size={18} />
                            {t('changePassword')}
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    variants={tabAnimationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 sm:p-8"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--title)] mb-6 flex items-center gap-2">
                      <Icon name="Bell" size={24} className="text-[var(--blog-accent)]" />
                      {t('notificationSettings')}
                    </h2>
                    
                    <div className="space-y-6">
                      {/* General Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--title)] mb-4">
                          {t('generalNotifications')}
                        </h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--selecter)] transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Icon name="Mail" size={20} className="text-[var(--text-color)] opacity-60" />
                              <div>
                                <span className="block font-medium text-[var(--title)]">
                                  {t('emailNotifications')}
                                </span>
                                <span className="text-sm text-[var(--text-color)] opacity-60">
                                  {t('emailNotificationsDesc')}
                                </span>
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={notifications.emailNotifications}
                                onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blog-accent)]"></div>
                            </div>
                          </label>
                          
                          <label className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--selecter)] transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Icon name="Smartphone" size={20} className="text-[var(--text-color)] opacity-60" />
                              <div>
                                <span className="block font-medium text-[var(--title)]">
                                  {t('pushNotifications')}
                                </span>
                                <span className="text-sm text-[var(--text-color)] opacity-60">
                                  {t('pushNotificationsDesc')}
                                </span>
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={notifications.pushNotifications}
                                onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blog-accent)]"></div>
                            </div>
                          </label>
                          
                          <label className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--selecter)] transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Icon name="TrendingUp" size={20} className="text-[var(--text-color)] opacity-60" />
                              <div>
                                <span className="block font-medium text-[var(--title)]">
                                  {t('marketingEmails')}
                                </span>
                                <span className="text-sm text-[var(--text-color)] opacity-60">
                                  {t('marketingEmailsDesc')}
                                </span>
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={notifications.marketingEmails}
                                onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blog-accent)]"></div>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      {/* Activity Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--title)] mb-4">
                          {t('activityNotifications')}
                        </h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--selecter)] transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Icon name="MessageCircle" size={20} className="text-[var(--text-color)] opacity-60" />
                              <div>
                                <span className="block font-medium text-[var(--title)]">
                                  {t('commentNotifications')}
                                </span>
                                <span className="text-sm text-[var(--text-color)] opacity-60">
                                  {t('commentNotificationsDesc')}
                                </span>
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={notifications.commentNotifications}
                                onChange={(e) => setNotifications({ ...notifications, commentNotifications: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blog-accent)]"></div>
                            </div>
                          </label>
                          
                          <label className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--selecter)] transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Icon name="Heart" size={20} className="text-[var(--text-color)] opacity-60" />
                              <div>
                                <span className="block font-medium text-[var(--title)]">
                                  {t('likeNotifications')}
                                </span>
                                <span className="text-sm text-[var(--text-color)] opacity-60">
                                  {t('likeNotificationsDesc')}
                                </span>
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={notifications.likeNotifications}
                                onChange={(e) => setNotifications({ ...notifications, likeNotifications: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blog-accent)]"></div>
                            </div>
                          </label>
                          
                          <label className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--selecter)] transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Icon name="UserPlus" size={20} className="text-[var(--text-color)] opacity-60" />
                              <div>
                                <span className="block font-medium text-[var(--title)]">
                                  {t('followNotifications')}
                                </span>
                                <span className="text-sm text-[var(--text-color)] opacity-60">
                                  {t('followNotificationsDesc')}
                                </span>
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={notifications.followNotifications}
                                onChange={(e) => setNotifications({ ...notifications, followNotifications: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blog-accent)]"></div>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={handleNotificationUpdate}
                          disabled={loading}
                          className="px-6 py-3 bg-[var(--blog-accent)] text-white rounded-lg hover:bg-[var(--blog-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {t('saving')}
                            </>
                          ) : (
                            <>
                              <Icon name="Check" size={18} />
                              {t('save')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <motion.div
                    key="privacy"
                    variants={tabAnimationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 sm:p-8"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--title)] mb-6 flex items-center gap-2">
                      <Icon name="Shield" size={24} className="text-[var(--blog-accent)]" />
                      {t('privacySettings')}
                    </h2>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--selecter)] transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Icon name="Globe" size={20} className="text-[var(--text-color)] opacity-60" />
                            <span className="font-medium text-[var(--title)]">
                              {t('publicProfile')}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-color)] opacity-60 ml-8">
                            {t('publicProfileDesc')}
                          </p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={privacy.profilePublic}
                            onChange={(e) => setPrivacy({ ...privacy, profilePublic: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blog-accent)]"></div>
                        </div>
                      </label>
                      
                      <label className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--selecter)] transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Icon name="Mail" size={20} className="text-[var(--text-color)] opacity-60" />
                            <span className="font-medium text-[var(--title)]">
                              {t('showEmail')}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-color)] opacity-60 ml-8">
                            {t('showEmailDesc')}
                          </p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={privacy.showEmail}
                            onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blog-accent)]"></div>
                        </div>
                      </label>
                      
                      <label className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--selecter)] transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Icon name="Activity" size={20} className="text-[var(--text-color)] opacity-60" />
                            <span className="font-medium text-[var(--title)]">
                              {t('showActivity')}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-color)] opacity-60 ml-8">
                            {t('showActivityDesc')}
                          </p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={privacy.showActivity}
                            onChange={(e) => setPrivacy({ ...privacy, showActivity: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blog-accent)]"></div>
                        </div>
                      </label>
                      
                      <label className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--selecter)] transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Icon name="MessageSquare" size={20} className="text-[var(--text-color)] opacity-60" />
                            <span className="font-medium text-[var(--title)]">
                              {t('allowMessages')}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-color)] opacity-60 ml-8">
                            {t('allowMessagesDesc')}
                          </p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={privacy.allowMessages}
                            onChange={(e) => setPrivacy({ ...privacy, allowMessages: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blog-accent)]"></div>
                        </div>
                      </label>
                      
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={handlePrivacyUpdate}
                          disabled={loading}
                          className="px-6 py-3 bg-[var(--blog-accent)] text-white rounded-lg hover:bg-[var(--blog-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {t('saving')}
                            </>
                          ) : (
                            <>
                              <Icon name="Check" size={18} />
                              {t('save')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                  <motion.div
                    key="account"
                    variants={tabAnimationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 sm:p-8"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--title)] mb-6 flex items-center gap-2">
                      <Icon name="Settings" size={24} className="text-[var(--blog-accent)]" />
                      {t('accountSettings')}
                    </h2>
                    
                    <div className="space-y-8">
                      {/* Account Info */}
                      <div className="p-6 bg-[var(--background)] rounded-lg">
                        <h3 className="font-semibold text-[var(--title)] mb-4 flex items-center gap-2">
                          <Icon name="Info" size={20} className="text-[var(--blog-accent)]" />
                          {t('accountInfo')}
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-[var(--text-color)] opacity-60">
                              {t('memberId')}
                            </span>
                            <span className="font-medium text-[var(--title)]">
                              {user?.id || '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-[var(--text-color)] opacity-60">
                              {t('email')}
                            </span>
                            <span className="font-medium text-[var(--title)]">
                              {user?.email || '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-[var(--text-color)] opacity-60">
                              {t('joinDate')}
                            </span>
                            <span className="font-medium text-[var(--title)]">
                              -
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Data Export */}
                      <div className="p-6 bg-[var(--background)] rounded-lg">
                        <h3 className="font-semibold text-[var(--title)] mb-2 flex items-center gap-2">
                          <Icon name="Download" size={20} className="text-[var(--blog-accent)]" />
                          {t('dataExport')}
                        </h3>
                        <p className="text-sm text-[var(--text-color)] opacity-60 mb-4">
                          {t('dataExportDesc')}
                        </p>
                        <button className="px-4 py-2 border border-[var(--border-color)] text-[var(--title)] rounded-lg hover:bg-[var(--selecter)] transition-colors flex items-center gap-2">
                          <Icon name="FileDown" size={18} />
                          {t('exportData')}
                        </button>
                      </div>
                      
                      {/* Danger Zone */}
                      <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                          <Icon name="AlertTriangle" size={20} />
                          {t('dangerZone')}
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400 opacity-80 mb-4">
                          {t('deleteAccountDesc')}
                        </p>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {t('deleting')}
                            </>
                          ) : (
                            <>
                              <Icon name="Trash2" size={18} />
                              {t('deleteAccount')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}