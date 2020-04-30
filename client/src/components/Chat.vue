<template>
  <div>
    <div v-for="message in messages" :key="message.id">
      {{ messageFrom(message)}}: {{ message.text }}
    </div>

    <input v-model="text" placeholder="Type something... make it memorable.">

    <button class="button is-light is-small" v-on:click="sendMessage">Send</button>
  </div>
</template>

<script>
  export default {
    sockets: {
      SESSION_UPDATED: function({ profile }) {
        this.profile = profile;
      },
      NEW_MESSAGE: function({ message}) {
        this.messages.push(message)
      }
    },
    methods: {
      sendMessage: function() {
        if (this.text) {
          this.$socket.emit('SEND_MESSAGE', { text: this.text })
          this.text = '';
        }
      },
      messageFrom: function(message) {
        return this.profile.name === message.from ? 'You' : message.from
      }
    },
    data: () => ({
      profile: '',
      messages: [],
      text: ''
    })
  }
</script>