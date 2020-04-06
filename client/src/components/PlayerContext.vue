<template>
  <div v-if="player">
    <Player v-bind:player="player"></Player>
    <Members v-bind:list="members"></Members>
    <button v-on:click="join">Join session</button>
  </div>
  <div v-else>
    No player found. Looks like {{ user.name }} is not playing any music. :-(
  </div>
</template>

<script>
  import Player from "./Player.vue"
  import Members from "./Members.vue"

  export default {
    components: {
      Player,
      Members
    },
    sockets: {
      PLAYER_UPDATED: function({ player, user }) {
        this.player = player;
        this.user = user;
      },
      MEMBERS_UPDATED: function(socket_data) {
        this.members = socket_data.members;
      }
    },

    data: () => ({
      user: '',
      player: '',
      members: ''
    }),

    methods: {
      join: function(event) {
        console.log('joining...', event)
        alert('joined')
      }
    }
  }
</script>