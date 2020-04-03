<template>
  <div class="container">
    <Profile></Profile>
    <h2>Fogón name: {{ room }}</h2>
    <Player></Player>
    <Members></Members>
  </div>
</template>

<script>

import Player from "../components/Player.vue"
import Members from "../components/Members.vue"
import Profile from "../components/Profile.vue"

export default {
  components: {
    Player,
    Profile,
    Members
  },
  sockets: {
    PROFILE_UPDATED: function({ profile }) {
      this.username = profile.username
      this.name = profile.name

      this.room = this.$route.params.username ? this.$route.params.username : this.username;
      this.$socket.emit('JOIN', { room: this.room })
    }
  },

  data: () => ({
    username: '',
    name: '',
    room: ''
  })
};
</script>
