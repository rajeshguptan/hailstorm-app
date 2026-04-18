import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import AppLayout from '../layouts/AppLayout.vue';
import CollectionsView from '../views/CollectionsView.vue';
import EnvironmentsView from '../views/EnvironmentsView.vue';
import HistoryView from '../views/HistoryView.vue';
import SecretsView from '../views/SecretsView.vue';
import StatsView from '../views/StatsView.vue';
import SettingsView from '../views/SettingsView.vue';
import UtilitiesView from '../views/UtilitiesView.vue';
import RunnerView from '../views/RunnerView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        redirect: '/collections'
      },
      {
        path: 'collections',
        name: 'collections',
        component: CollectionsView
      },
      {
        path: 'environments',
        name: 'environments',
        component: EnvironmentsView
      },
      {
        path: 'history',
        name: 'history',
        component: HistoryView
      },
      {
        path: 'secrets',
        name: 'secrets',
        component: SecretsView
      },
      {
        path: 'stats',
        name: 'stats',
        component: StatsView
      },
      {
        path: 'utilities',
        name: 'utilities',
        component: UtilitiesView
      },
      {
        path: 'runner',
        name: 'runner',
        component: RunnerView
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView
      }
    ]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
