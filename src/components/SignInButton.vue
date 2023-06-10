<template>
    <div>
      
      <!-- <button type="button" class="el-button" v-on:click="loginPopup"> Login </button> -->
      <button type="button" class="el-button" v-on:click="loginRedirect">Login</button>
    </div>
</template>

<script setup lang="ts">
import { useMsal } from '../composition-api/useMsal';
import { loginRequest } from "../authConfig";

const { instance } = useMsal();

// const loginPopup = () => {
//   instance.loginPopup(loginRequest);
// }
    
const loginRedirect = () => {
  instance.loginRedirect(loginRequest);
}
</script>
