import { defineStore } from 'pinia';
import pinia from '@/store';
import { AppState } from './types';

export const useHomeStore = defineStore(
   // 唯一ID
   'Home',
   {
      state: () => ({
         title: 'dp-demo',
      }),
      getters: {},
      actions: {
         updateInfo(partial: Partial<AppState>) {
            this.$patch(partial);
         },
      },
   }
);

export function useHomeStoreHook() {
   return useHomeStore(pinia);
}
