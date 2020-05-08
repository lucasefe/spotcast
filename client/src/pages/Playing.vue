
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
                  <Player v-bind:player="player"></Player>
                </div>
                <div v-else>
                  You're currently not playing anything.
                </div>
              </article>
              <article class="tile is-child">
                <PlayerMembers></PlayerMembers>
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
import PlayerMembers from "../components/PlayerMembers.vue"
import Player from "../components/Player.vue"

export default {
  components: {
    Chat,
    PlayerMembers,
    Player,
    Profile
  },

  sockets: {
    PLAYER_UPDATED: function({ player, session }) {
      this.player = player;
      this.session = session;
    }
  },

  data: () => ({
    player: '',
    session: ''
  })
};

</script>
