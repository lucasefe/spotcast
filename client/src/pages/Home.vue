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
      this.username = profile.username;
      this.name = profile.name;
      this.room = profile.room;

      const routeRoom = this.$route.params.room;
      // join specific room
      if (routeRoom && routeRoom !== this.room) {
        this.$socket.emit('JOIN', { room: routeRoom})
      }
    }
  },

  data: () => ({
    username: '',
    name: '',
    room: ''
  })
};
</script>
