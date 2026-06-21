<template>
  <div class="settings-panel">
    <div class="flex gap-2 mb-2">
      <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 flex-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" @click="handleImport">Import Settings</button>
      <button class="btn btn-sm bg-blue-500 text-white flex-1 hover:bg-blue-600" @click="resetToDefaults()">Reset to Defaults</button>
    </div>
    <div v-if="settingsCategories.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
      No settings categories
    </div>
    <div v-else>
      <div v-for="category in settingsCategories" :key="category.id" class="settings-category-item mb-2">
        <div class="flex items-center p-2 rounded bg-zinc-200 dark:bg-zinc-800 cursor-pointer" @click="toggleCategory(category.id)" @contextmenu.prevent="uiStore.showContextMenu($event, 'settings-category', category.id)">
          <span class="mr-2">{{ expandedCategories.includes(category.id) ? '📂' : '📁' }}</span>
          <span class="flex-1 text-zinc-900 dark:text-white">{{ category.name }}</span>
        </div>
        <div v-if="expandedCategories.includes(category.id)" class="ml-3 mt-1">
          <div v-for="setting in category.settings" :key="setting.id" class="setting-item p-1 rounded cursor-pointer mb-1 flex items-center bg-zinc-100 dark:bg-zinc-800" :style="{ paddingLeft: '8px' }" @click="handleSettingClick($event, setting)" @contextmenu.prevent="uiStore.showContextMenu($event, 'setting', setting.id)" role="button" tabindex="0" @keydown.enter="handleSettingClick($event, setting)">
            <span v-if="hasSubSettings(setting)" class="mr-1 cursor-pointer text-blue-400" @click.stop="toggleSubSettings(setting.id)">{{ expandedSubSettings.includes(setting.id) ? '▼' : '▶' }}</span>
            <span class="flex-1 text-zinc-900 dark:text-white">{{ setting.name }}</span>
          </div>
          <div v-if="expandedSubSettings.length > 0" class="ml-3">
            <div v-for="subSetting in expandedSubSettingsMap[activeSubSettingParentId] || []" :key="subSetting.id" class="sub-setting-item p-1 rounded cursor-pointer mb-1 flex items-center bg-zinc-100 dark:bg-zinc-800" :style="{ paddingLeft: '16px' }" @click.stop="handleSubSettingClick($event, subSetting)" @contextmenu.prevent="uiStore.showContextMenu($event, 'sub-setting', subSetting.id)">
              <span class="mr-1 text-blue-400">{{ subSetting.icon }}</span>
              <span class="flex-1 text-zinc-900 dark:text-white">{{ subSetting.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { useUIStore } from '../../stores/ui';
import type { SettingsCategory, Setting, SubSetting } from '../../types';

const settingsStore = useSettingsStore();
const uiStore = useUIStore();
const settingsCategories = computed(() => settingsStore.settingsCategories);
const expandedSubSettingsMap = computed(() => {
  const map: Record<string, SubSetting[]> = {};
  settingsStore.settingsCategories.forEach((category: SettingsCategory) => {
    category.settings.forEach((setting: Setting) => {
      if (setting.subSettings) {
        map[setting.id] = setting.subSettings;
      }
    });
  });
  return map;
});

// Expand states
const expandedCategories = ref<string[]>([]);
const expandedSubSettings = ref<string[]>([]);
const activeSubSettingParentId = ref<string | null>(null);

async function handleImport() {
  try {
    if (!window.api) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          importSettings(data);
        } catch (err) {
          console.error('Failed to import settings:', err);
        }
      };
      input.click();
      return;
    }
    const content = await window.api.importCollection();
    if (!content) {
      return;
    }
    const data = JSON.parse(content);
    importSettings(data);
  } catch (err) {
    console.error('Import error:', err);
  }
}

function importSettings(data: any) {
  if (!data) return;
  if (data.settingsCategories) {
    settingsStore.settingsCategories = data.settingsCategories;
    settingsStore.saveToLocalStorage();
  } else if (Array.isArray(data)) {
    settingsStore.settingsCategories = data;
    settingsStore.saveToLocalStorage();
  }
}

function toggleCategory(id: string) {
  const index = expandedCategories.value.indexOf(id);
  if (index > -1) {
    expandedCategories.value.splice(index, 1);
    if (activeSubSettingParentId.value === id) {
      activeSubSettingParentId.value = null;
      expandedSubSettings.value = [];
    }
  } else {
    expandedCategories.value.push(id);
  }
}

function handleSettingClick(event: MouseEvent, setting: Setting) {
  event.preventDefault();
  event.stopPropagation();
  if (hasSubSettings(setting)) {
    toggleSubSettings(setting.id);
  } else {
    settingsStore.selectSetting(setting.id);
  }
}

function toggleSubSettings(id: string) {
  const index = expandedSubSettings.value.indexOf(id);
  if (index > -1) {
    expandedSubSettings.value.splice(index, 1);
    activeSubSettingParentId.value = null;
  } else {
    expandedSubSettings.value.push(id);
    activeSubSettingParentId.value = id;
  }
}

function handleSubSettingClick(event: MouseEvent, subSetting: SubSetting) {
  event.preventDefault();
  event.stopPropagation();
  settingsStore.selectSubSetting(subSetting.id);
}

function hasSubSettings(setting: Setting): boolean {
  return 'subSettings' in setting && setting.subSettings && setting.subSettings.length > 0;
}

function resetToDefaults() {
  settingsStore.resetSettingsToDefaults();
}
</script>