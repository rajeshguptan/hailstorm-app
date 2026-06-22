import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import AppLayout from '../layouts/AppLayout.vue';
import CollectionsView from '../views/CollectionsView.vue';
import HistoryView from '../views/HistoryView.vue';
import SecretsView from '../views/SecretsView.vue';
import StatsView from '../views/StatsView.vue';
import SettingsView from '../views/SettingsView.vue';
import RunnerView from '../views/RunnerView.vue';
import ConsoleView from '../views/ConsoleView.vue';
import DocsView from '../views/DocsView.vue';
import FeedbackView from '../views/FeedbackView.vue';

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
        path: 'runner',
        name: 'runner',
        component: RunnerView
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView
      },
      {
        path: 'console',
        name: 'console',
        component: ConsoleView
      },
      {
        path: 'docs',
        name: 'docs',
        component: DocsView
      },
      {
        path: 'feedback',
        name: 'feedback',
        component: FeedbackView
      }
    ]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;