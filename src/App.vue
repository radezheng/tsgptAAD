<template>
  <div id="app">
    <header>
      <div class="title">{{ title }}</div>
      <div class="username">
      <SignOutButton v-if="isAuthenticated"/>
            <SignInButton v-else />
          </div>
    </header>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { useIsAuthenticated } from './composition-api/useIsAuthenticated';
import SignInButton from "./components/SignInButton.vue";
import SignOutButton from "./components/SignOutButton.vue";

export default {
name: 'App',

components: {
    SignInButton,
    SignOutButton,
  },

  setup() {
    const isAuthenticated = useIsAuthenticated();
    // console.log(isAuthenticated);
    return { isAuthenticated };
  },

data() {
    return {
      // orgtitle: '欢迎使用Azure OpenAI',
      title: '欢迎使用Azure OpenAI',
      username: '登录用户名',
    };
  },
  methods: {
    logout() {
      // msalInstance.handleRedirectPromise()
      console.log('用户已退出');
    },

    signIn() {
    //   login().then((response) => {
    //     console.log(response);
    //   });
    },
    
  },
};
</script>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  padding: 10px;
  background-color: #f1f1f1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.username {
  display: flex;
  align-items: center;
}

.title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  align-content: center;
  width: 80%;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-info span {
  margin-right: 10px;
}

button {
  background-color: #ff4d4d;
  color: rgb(146, 143, 143);
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

button:hover {
  background-color: #ff7878;
}


</style>