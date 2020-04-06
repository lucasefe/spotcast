<template>
  <div class="container">
    <Profile></Profile>
    <h2>Fogón name: {{ room }}</h2>
    <PlayerContext></PlayerContext>
  </div>
</template>

<script>

import Profile from "../components/Profile.vue";
import PlayerContext from "../components/PlayerContext.vue"

export default {
  components: {
    PlayerContext,
    Profile
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
