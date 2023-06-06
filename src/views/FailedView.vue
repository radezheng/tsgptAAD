<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'FailedView',
  setup() {
    const router = useRouter()

    const goBack = () => {
      router.go(-1)
    }

    return {
      goBack
    }
  }
})
</script>

<template>
  <h1>无权访问！</h1>

  <div class="card">
    <button @click="goBack" class="back-button">Back</button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
