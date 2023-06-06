/// <reference types="node" />
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import AppList from '../views/AppList.vue'
import ChatGPT from '../views/ChatGPT.vue'
import GPTApps from '../views/GPTApps.vue'
import FailedView from '../views/FailedView.vue'
import { registerGuard } from './Guard'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/chat/:appName',
    name: 'ChatGPT',
    component: ChatGPT,
    meta: {
      requiresAuth: true
  }
  },
  {
    path: '/clonegpt/:appName',
    name: 'CloneGPT',
    component: GPTApps,
    meta: {
      requiresAdmin: true
  }
  },
  {
    path: '/',
    name: 'applist',
    component: AppList,
  },
  {
    path: '/addgpt',
    name: 'AddGPT',
    component: GPTApps,
    meta: {
      requiresAdmin: true
  }
  },
  {
    path: '/failed',
    name: 'FailedView',
    component: FailedView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

registerGuard(router)

export default router
