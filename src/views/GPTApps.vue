<template>
  <div>
    <button @click="goBack" class="back-button">Back</button>
    <h1 class="centered">Add App</h1>
    <form @submit.prevent="addApp" class="form-table">
      <!-- Add the class 'form-row' to each div -->
      <div class="form-row">
        <label for="name">Name:</label>
        <input type="text" id="name" v-model="appData.name" required />
      </div>
      <div class="form-row">
        <label for="description">描述:</label>
        <textarea id="description" v-model="appData.description" required></textarea>
      </div>
      <div class="form-row">
        <label for="dataground">Data Ground:</label>
        <textarea id="dataground" v-model="appData.dataground" required></textarea>
      </div>
      <div class="form-row">
        <label for="temperature">Temperature:</label>
        <input type="range" id="temperature" v-model="appData.temperature" min="0" max="1" step="0.01" required /> {{appData.temperature}}
      </div>
      <div class="form-row">
        <label for="max_tokens">Max Tokens:</label>
        <input type="number" id="max_tokens" v-model="appData.max_tokens" required />
      </div>
      <div class="form-row" style="display: none;">
        <label for="top_p">Top P:</label>
        <input type="number" id="top_p" v-model="appData.top_p" required />
      </div>
      
      <div class="form-row">
        <label for="welcome">Welcome:</label>
        <textarea id="welcome" v-model="appData.welcome" required></textarea>
      </div>
      <div class="centered" width="100%">
      <button type="submit" >Submit</button>
    </div>
    </form>
  </div>
</template>
  
  <script lang="ts">
  import axios from 'axios';
  import { useRoute } from 'vue-router'
  
  export default {

    data() {
      return {
        loading: false as boolean,
        appData: {
          name: '',
          description: '测试用，可以对比不同的参数以及dataground的效果。',
          dataground: 'You are a helpful assistant.',
          temperature: '0.5',
          max_tokens: '1000',
          top_p: '1',
          // title: "欢迎使用Azure OpenAI ChatGPT",
          welcome: '您好, 您正在与Azure OpenAI聊天，如果想保留聊天内容，可以按Ctrl + S来保存哦。',
        },
      };
    },

    mounted() {
      if (this.$route.params.appName) {
        
        this.fetchAppData();
      }
      
    },

    methods: {
      goBack() {
      this.$router.go(-1);
    },

    async fetchAppData() {
      const route = useRoute();
      const appName = route.params.appName; 
      try {
        this.loading = true;
        const response = await fetch(`/api/gptapps/${appName}`);
        const data = await response.json();

        if (data && data.length > 0) {
          this.appData = data[0];
          this.appData.name = this.appData.name + "-Copy"
          this.loading = false;
        }
      } catch (error) {
        console.error('Error fetching app data:', error);
        this.loading = false;
      }
    },

      async addApp() {
        try {
          const response = await axios.post('/api/gptapps/add', this.appData);
          if (response.status === 201) {
            alert('App added successfully');
            this.goBack();
            
          }
        } catch (error) {
          console.error(error);
          alert('Error adding app');
        }
      },
    },
  };
  </script>

<style>
.centered {
  text-align: center;
  display: block;
}

.back-button {
  display: inline-block;
  margin: 10px;
  cursor: pointer;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 5px 10px;
  text-align: center;
  color: #333;
  font-size: 14px;
  text-decoration: none;
  transition: background-color 0.2s ease-in-out;
}

.back-button:hover {
  background-color: #e0e0e0;
}
.form-table {
  display: table;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.form-row {
  display: table-row;
}

.form-row label,
.form-row input,
.form-row textarea {
  display: table-cell;
  vertical-align: middle;
  padding: 5px;
}

.form-row label {
  text-align: right;
  padding-right: 10px;
}

.form-row input,
.form-row textarea {
  text-align: left;
}

textarea {
  width: 100%;
  height: 30px;
  resize: vertical;
}

button[type="submit"] {
  display: block;
  /* margin: 10px auto; */
}
</style>  