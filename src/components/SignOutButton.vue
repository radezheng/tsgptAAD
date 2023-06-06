<template>
        <WelcomeName /> 
        <div>
      <button @click="logoutPopup">注销</button>
      <!-- <button @click="logoutRedirect">Logout Redirect</button> -->
    </div>
</template>

<script setup lang="ts">
import { useMsal } from '../composition-api/useMsal';
import WelcomeName from './WelcomeName.vue';
    
const { instance } = useMsal();

const logoutPopup = () => {
  instance.logoutPopup({
    mainWindowRedirectUri: "/"
  });
}

// const logoutRedirect = () => {
//   instance.logoutRedirect();
// }
</script>
