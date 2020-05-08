
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
                <div v-if="player">
                  <h2 class="subtitle">{{ this.session.name }}'s Fogón. </h2>
                  <Player v-bind:player="player"></Player>
                </div>
                <div v-else>
                  Nothing is currently playing on {{ $route.params.room }}
                </div>
              </article>
              <article class="tile is-child">
                <PlayerActions></PlayerActions>
              </article>
            </div>
          </div>
        </div>

        <div class="tile is-parent is-4">
          <article class="tile is-child box">
            <Chat></Chat>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script>

import Chat from "../components/Chat.vue";
import Profile from "../components/Profile.vue";
import Player from "../components/Player.vue";
import PlayerActions from "../components/PlayerActions.vue";

export default {
  components: {
    Chat,
    Profile,
    Player,
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
    },
    PLAYER_UPDATED: function({ player, session }) {
      this.player = player;
      this.session = session;
    }
  },
  data: () => ({
    username: '',
    name: '',
    room: '',
    player: '',
    session: ''
  })
};
</script>
