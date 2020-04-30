
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
                <PlayerState></PlayerState>
              </article>
              <article class="tile is-child">
                <PlayerActions></PlayerActions>
              </article>
            </div>
          </div>
        </div>

        <div class="tile is-parent is-4">
          <article class="tile is-child box">
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script>

import Profile from "../components/Profile.vue";
import PlayerState from "../components/PlayerState.vue";
import PlayerActions from "../components/PlayerActions.vue";

export default {
  components: {
    Profile,
    PlayerState,
    PlayerActions
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
