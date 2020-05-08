<template>
    <div v-if="player">
      <Player v-bind:player="player"></Player>
    </div>
    <div v-else>
      Nothing is currently playing on  {{ $route.params.room }}
    </div>
</template>

<script>
  import Player from './Player.vue';

  export default {
    components: {
      Player
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
    }),
    computed:{
      type: function() {
        return this.player.isPlaying ? 'is-success' : 'is-darkgrey';
      }
    }
  }
</script>