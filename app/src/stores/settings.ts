import { defineStore } from 'pinia';
import type { SettingsCategory, Setting, SubSetting } from '../types';
import { useAppStore } from './';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settingsCategories: [] as SettingsCategory[],
    selectedSettingId: null as string | null,
    selectedSubSettingId: null as string | null,
  }),

  getters: {
    selectedSetting: (state) => {
      if (!state.selectedSettingId) return null;
      // Find setting across all categories
      for (const category of state.settingsCategories) {
        const setting = category.settings.find(s => s.id === state.selectedSettingId);
        if (setting) return setting;
        // Check sub-settings
        if (setting?.subSettings) {
          const subSetting = setting.subSettings.find(ss => ss.id === state.selectedSettingId);
          if (subSetting) return subSetting;
        }
      }
      return null;
    }
  },

  actions: {
    loadDefaultSettings() {
      this.settingsCategories = [
        {
          id: 'ui',
          name: 'User Interface',
          icon: '🎨',
          settings: [
            {
              id: 'theme',
              name: 'Theme',
              description: 'Choose your preferred color scheme',
              subSettings: [
                { id: 'theme-light', name: 'Light', icon: '☀️' },
                { id: 'theme-dark', name: 'Dark', icon: '🌙' },
                { id: 'theme-system', name: 'System', icon: '💻' }
              ]
            },
            {
              id: 'font',
              name: 'Font Size',
              description: 'Adjust font sizes for better readability',
              subSettings: [
                { id: 'font-ui', name: 'UI Font Size', icon: '🔤' },
                { id: 'font-code', name: 'Code Font Size', icon: '🔤' },
                { id: 'font-editor', name: 'Editor Font Size', icon: '📝' }
              ]
            },
            {
              id: 'layout',
              name: 'Layout',
              description: 'Customize application layout',
              subSettings: [
                { id: 'layout-sidebar', name: 'Show Sidebar', icon: '📑' },
                { id: 'layout-compact', name: 'Compact Mode', icon: '📐' },
                { id: 'layout-autosave', name: 'Auto-save Requests', icon: '💾' }
              ]
            }
          ]
        },
        {
          id: 'app',
          name: 'Application',
          icon: '⚙️',
          settings: [
            {
              id: 'network',
              name: 'Network',
              description: 'Configure network settings',
              subSettings: [
                { id: 'network-timeout', name: 'Request Timeout', icon: '⏱️' },
                { id: 'network-max-size', name: 'Max Response Size', icon: '📦' },
                { id: 'network-redirects', name: 'Follow Redirects', icon: '🔄' },
                { id: 'network-ssl', name: 'SSL Verification', icon: '🔒' }
              ]
            },
            {
              id: 'certificate',
              name: 'Certificates',
              description: 'Manage SSL certificates',
              subSettings: [
                { id: 'cert-manager', name: 'Certificate Manager', icon: '📜' }
              ]
            },
            {
              id: 'proxy',
              name: 'Proxy',
              description: 'Configure proxy settings',
              subSettings: [
                { id: 'proxy-url', name: 'Proxy URL', icon: '🌐' },
                { id: 'proxy-username', name: 'Username', icon: '👤' },
                { id: 'proxy-password', name: 'Password', icon: '🔑' }
              ]
            },
            {
              id: 'variables',
              name: 'Variables',
              description: 'Configure global variables',
              subSettings: [
                { id: 'vars-list', name: 'Variables List', icon: '📋' },
                { id: 'vars-add', name: 'Add Variable', icon: '➕' }
              ]
            }
          ]
        },
        {
          id: 'advanced',
          name: 'Advanced',
          icon: '🔧',
          settings: [
{
          id: 'shortcuts',
          name: 'Keyboard Shortcuts',
          description: 'View and customize keyboard shortcuts',
          subSettings: [
            { id: 'shortcuts-view', name: 'View Shortcuts', icon: '⌨️' }
          ]
        },
        {
          id: 'logging',
          name: 'Logging',
          description: 'Configure application logging level',
          subSettings: [
            { id: 'logging-level', name: 'Log Level', icon: '📝' }
          ]
        }
            ]
        }
      ];
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    selectSetting(id: string) {
      this.selectedSettingId = id;
      this.selectedSubSettingId = null;
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    selectSubSetting(id: string) {
      this.selectedSubSettingId = id;
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    resetSettingsToDefaults() {
      this.loadDefaultSettings();
    }
  }
});