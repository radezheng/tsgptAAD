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

<script setup lang="ts">
//  import axios from "axios";
//@ts-ignore
import { VueShowdown } from "vue-showdown";
import { useRoute } from 'vue-router'
import { useMsalAuthentication } from "../composition-api/useMsalAuthentication";
import { InteractionType } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";
import { watch,  ref } from "vue";

var url = "/api/chat/completions/stream";

const {result }  = useMsalAuthentication(InteractionType.Redirect, loginRequest);
const route = useRoute();


interface App {
  app_id: string;
  name: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  welcome: string;
  dataground: string;
};




    // const result = res.result;
    
    // console.log("result->", result.value);
    
  
let inputMessage = "";
let messages = [] as { role: string; content: string }[];
let msgtosend = [] as { role: string; content: string }[];
let contextMaxLength = 5;
let loading = false;
let streaming = false;
let tk = null as string | null;
let curApp = null as App | null;





    
    function addMessage (msg: { role: string; content: string }) {
      if (msg && msg.content)
        if (msg) {
          messages.push(msg);
        }
        else
          console.log(msg);
    };

    async function fetchAppData() {

      const appName = route.params.appName;

      // if(!tk){
      //   acquireToken();
      // }
      
      try {
        loading = true;
        const response = await fetch(`/api/gptapps/${appName}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tk}`,
          },
        });
        const data = await response.json();

        if (data && data.length > 0) {
          curApp = data[0] as App;
          if (curApp && curApp.welcome)
            addMessage({ role: "assistant", content: curApp.welcome });

        } else {
          //parse the data readable stream to string
         console.log("data->", data);
          
          addMessage({ role: "assistant", content: data.message + ": " + data.error.name});

          console.log(response);
        }
        loading = false;
      } catch (error: any) {
        console.error('Error fetching app data:', error);
        if(error)
          addMessage({ role: "assistant", content: error});
        else
          addMessage({ role: "assistant", content: "Error fetching app data"});
        loading = false;
      }
    };

    function clearMessage() {
      messages = [];
    };



    function sendMessage() {
      if (inputMessage.trim() && curApp) {
        var dataground = { role: "system", content: curApp.dataground };
        addMessage({ role: "user", content: inputMessage });

        msgtosend = [];
        for (
          let i = Math.max(0, messages.length - contextMaxLength);
          i < messages.length;
          i++
        ) {
          msgtosend.push(messages[i]);
        }

        msgtosend.unshift(dataground);

        loading = true;
        streaming = false;
        scrollToBottom();
        let tk = null;
        if(result.value) 
          tk = result.value.accessToken;

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", `Bearer ${tk}`);
        // xhr.setRequestHeader("Ocp-Apim-Subscription-Key", curApp.apimKey);
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
                if (lines[i].indexOf("error") > 0) {
                  addMessage({ role: "assistant", content: lines[i] });
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
            if (streaming) messages.pop();
            addMessage(newmsg);
            streaming = true;
          } else if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
              loading = false;
              streaming = false;
            } else {
              console.error(xhr.statusText, xhr.response);
              loading = false;
              if (xhr.response.error) {
                addMessage({
                  role: "assistant",
                  content: xhr.response,
                });
              } else {
                addMessage({
                  role: "assistant",
                  content: xhr.response,
                });
              }
            }
          }
          scrollToBottom();

        };

        xhr.onerror = () => {
          console.error("Request failed due to a network error", xhr.response);
        };

        // console.log(msgtosend)

        xhr.send(
          JSON.stringify({
            messages: msgtosend,
            max_tokens: curApp.max_tokens,
            top_p: curApp.top_p,
            stop: null,
            temperature: curApp.temperature,
            stream: true,
          })
        );

        inputMessage = "";
        // scrollToBottom();
      }
    };

    function scrollToBottom() {
      const chatHistory = ref<HTMLDivElement | null>(null);
      if (chatHistory.value) 
        chatHistory.value.scrollTop = chatHistory.value.scrollHeight + 1000;
    };

    watch(result, () => {
    // Fetch new data from the API each time the result changes (i.e. a new access token was acquired)
      if (result.value){
        tk = result.value.accessToken;
        fetchAppData();
      }
    });



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
