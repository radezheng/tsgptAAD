<template>
  <div class="chat-container">
    <div class="chat-history" ref="chatHistory">
      <vue-showdown v-for="(message, index) in messages" :key="index"
        :markdown="'**' + message.role.toUpperCase() + '**: ' + message.content" flavor="github"
        extension="table,footnote" :class="message.role"></vue-showdown>
    </div>
    <div class="flashing-cursor" v-if="loading"></div>
    <form @submit.prevent="sendMessage" class="input-container">
      <textarea v-model="inputMessage" @keydown.enter.prevent="sendMessage" placeholder="输入你的消息..."></textarea>
      <button type="submit" :disabled="!curApp">发送</button>
      <button @click="clearMessage">Clear</button>
    </form>
  </div>
</template>

<script lang="ts">
//  import axios from "axios";
//@ts-ignore
import { VueShowdown } from "vue-showdown";
// import { useRoute } from 'vue-router'
import { useMsalAuthentication } from "../composition-api/useMsalAuthentication";
import { InteractionType } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";
import { watch } from "vue";

var url = "/api/chat/completions/stream";

interface App {
  app_id: string;
  name: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  welcome: string;
  dataground: string;
};
export default {
  components: {
    VueShowdown,
  },

  data() {
    return {
      inputMessage: "",
      messages: [] as { role: string; content: string }[],
      msgtosend: [] as { role: string; content: string }[],
      contextMaxLength: 5,
      loading: false,
      streaming: false,
      curApp: null as App | null,
      tk: null as string | null,

      // title: process.env.VUE_APP_TITLE ? process.env.VUE_APP_TITLE : '欢迎使用Azure OpenAI - GPT4',
    };
  },



  mounted() {

    const { result } = useMsalAuthentication(InteractionType.Redirect, loginRequest);

    watch(result, () => {
      // Fetch new data from the API each time the result changes (i.e. a new access token was acquired)
      if (result && result.value) {
        this.tk = result.value.accessToken;
        this.fetchAppData();
      }

    });


  },

  methods: {

    addMessage(msg: { role: string; content: string }) {
      if (msg && msg.content)
        if (msg) {
          this.messages.push(msg);
        }
        else
          console.log(msg);
    },

    async fetchAppData() {
      // const route = useRoute();
      const appName = this.$route.params.appName;
      try {
        this.loading = true;
        const response = await fetch(`/api/gptapps/${appName}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + this.tk
          },
        });
        const data = await response.json();

        if (data && data.length > 0) {
          this.curApp = data[0] as App;
          if (this.curApp && this.curApp.welcome)
            this.addMessage({ role: "assistant", content: this.curApp.welcome });

        } else {
          console.log(response)
        }
        this.loading = false;
      } catch (error: any) {
        console.error('Error fetching app data:', error);
        // if(error && error.toString())
        // this.addMessage({ role: "assistant", content: error.toString()});
        this.loading = false;
      }
    },

    clearMessage() {
      this.messages = [];
    },



    sendMessage() {
      if (this.inputMessage.trim() && this.curApp) {
        var dataground = { role: "system", content: this.curApp.dataground };
        this.addMessage({ role: "user", content: this.inputMessage });

        this.msgtosend = [];
        for (
          let i = Math.max(0, this.messages.length - this.contextMaxLength);
          i < this.messages.length;
          i++
        ) {
          this.msgtosend.push(this.messages[i]);
        }

        this.msgtosend.unshift(dataground);

        this.loading = true;
        this.streaming = false;
        this.scrollToBottom();
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer " + this.tk);
        // xhr.setRequestHeader("Ocp-Apim-Subscription-Key", this.curApp.apimKey);
        xhr.responseType = "text";
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.LOADING) {

            let res = xhr.responseText;
            // console.log(res);
            // break each lines of res to string
            let lines = res.split("\n");

            let newmsg: { role: string; content: string } = { role: "assistant", content: "" };
            //for each line, remove the first 5 characters

            for (let i = 0; i < lines.length; i++) {
              if (!lines[i]) continue;
              if (!lines[i].startsWith("data:")) {
                // console.log(lines[i]);
                if (lines[i].indexOf("error") > 0 || lines[i].indexOf("Error") > 0 
                  || lines[i].indexOf("\"statusCode\": 429") > 0) {
                  this.addMessage({ role: "assistant", content: lines[i] });
                }
                continue;
              }

              lines[i] = lines[i].slice(5);

              let jline: any = {
                finish_reason: "stop"
              };
              try {
                jline = JSON.parse(lines[i]);
              } catch (err) {
                console.log(err);
                console.log(lines[i]);
                continue;
              }
              if (jline && jline.hasOwnProperty('choices')) {
                jline = jline.choices[0];
              }
              if (jline.finish_reason == "stop") break;

              if (jline.delta.role)
                newmsg = { role: jline.delta.role, content: "" };

              if (jline.delta.content) newmsg.content += jline.delta.content;
            }

            //delete last message from messages
            if (this.streaming) this.messages.pop();
            this.addMessage(newmsg);
            this.streaming = true;
          } else if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
              this.loading = false;
              this.streaming = false;
            } else {
              console.error(xhr.statusText, xhr.response);
              this.loading = false;
              if (xhr.response.error) {
                this.addMessage({
                  role: "assistant",
                  content: xhr.response,
                });
              } else {
                this.addMessage({
                  role: "assistant",
                  content: xhr.response,
                });
              }
            }
          }
          this.scrollToBottom();

        };

        xhr.onerror = () => {
          console.error("Request failed due to a network error", xhr.response);
        };

        // console.log(this.msgtosend)

        xhr.send(
          JSON.stringify({
            messages: this.msgtosend,
            max_tokens: this.curApp.max_tokens,
            top_p: this.curApp.top_p,
            stop: null,
            temperature: this.curApp.temperature,
            stream: true,
          })
        );

        this.inputMessage = "";
        // this.scrollToBottom();
      }
    },

    scrollToBottom() {
      const chatHistoryElement = this.$refs.chatHistory as HTMLDivElement;
      chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight + 1000;
    },

  },
};
</script>

<style scoped>
/* @import "~github-markdown-css/github-markdown.css"; */

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border-left-color: #09f;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.flashing-cursor {
  display: inline-block;
  width: 10px;
  height: 20px;
  background-color: #000;
  animation: flashing-cursor 0.5s infinite;
}

@keyframes flashing-cursor {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

body {
  margin: 0px;
}

.header {
  background-color: #f5f5f5;
  padding: 10px;
  text-align: center;
  font-size: 20px;
  color: #333;
}

.chat-container {
  padding: 10px;
  align-items: center;
}

.assistant {
  background-color: rgb(228, 225, 225);
  padding: 1px;
  padding-left: 10px;
}

.user {
  padding-left: 10px;
}

.input-container {
  position: absolute;
  top: 90%;
  width: 90%;
  display: flex;
  padding: 5px;
}

.input-container textarea {
  flex-grow: 1;
  height: 2rem;
  margin-right: 5px;
  width: 70%;
}

.chat-history {
  max-height: calc(100vh - 18rem);
  padding: 1.5rem 0;
  overflow-y: scroll;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
