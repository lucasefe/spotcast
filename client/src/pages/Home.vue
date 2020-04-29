
<template>
  <section class="section">
    <div class="content">
      <div class="tile is-ancestor">
        <div class="tile is-parent">
          <article class="tile is-child">
            <Profile></Profile>
          </article>
        </div>
      </div>

      <div class="tile is-ancestor">
        <div class="tile is-vertical is-8">
          <div class="tile">
            <div class="tile is-parent is-vertical">
              <article class="tile is-child">
                <PlayerContext></PlayerContext>
              </article>
              <article class="tile is-child">
                <PlayerMembers></PlayerMembers>
              </article>
            </div>
          </div>
        </div>

        <div class="tile is-parent is-4">
          <article class="tile is-child box">
            <p class="title">Chat</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script>

import Profile from "../components/Profile.vue";
import PlayerContext from "../components/PlayerContext.vue"
import PlayerMembers from "../components/PlayerMembers.vue"

export default {
  components: {
    PlayerContext,
    PlayerMembers,
    Profile
  },
  sockets: {
    SESSION_UPDATED: function({ profile }) {
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
