<template>
  <div v-if="player">
    <div class="card">
      <div class="card-content">
        <div class="media">
          <div class="media-left">
            <figure class="image is-48x48">
              <img v-bind:src="player.albumCoverURL" class="is-128x128">
            </figure>
          </div>
          <div class="media-content">
            <p class="title is-4">{{player.trackName }}</p>
            <p class="subtitle is-6"> {{ player.artistName }}</p>
          </div>
        </div>
        <div class="content">
          <b-progress :value="player.trackProgress" type="is-success" size="is-small" format="percent"></b-progress>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    No player found. Looks like {{ user.name }} is not playing any music. :-(
  </div>
</template>

<script>
  export default {
    sockets: {
      PLAYER_UPDATED: function({ player, user }) {
        this.player = player;
        this.user = user;
      }
    },

    data: () => ({
      user: '',
      player: ''
    })

  }
</script>