<template>
  <div v-if="player">
    <Player v-bind:player="player"></Player>
    <b-table :data="members" :columns="columns"></b-table>

    <div v-if="canConnect">
      <div v-if="isConnected">
        <button v-on:click="disconnectPlayer">Disconnect you player</button>
      </div>
      <div v-else>
        <button v-on:click="connectPlayer">Connect your player</button>
      </div>
    </div>
  </div>
  <div v-else>
    No player found. Looks like {{ user.name }} is not playing any music. :-(
  </div>
</template>

<script>
  import Player from "./Player.vue"

  export default {
    components: {
      Player,
    },
    sockets: {
      PROFILE_UPDATED: function({ profile }) {
        this.username = profile.username;
      },
      PLAYER_UPDATED: function({ player, user, isConnected }) {
        this.player = player;
        this.user = user;
        this.isConnected = isConnected;
      },
      MEMBERS_UPDATED: function(socket_data) {
        this.members = socket_data.members;
      }
    },

    data: () => ({
      username: '',
      user: '',
      player: '',
      members: '',
      isConnected: '',
      columns: [
        {
          field: 'name',
          label: '',
          width: '40'
        }
      ]
    }),

    methods: {
      connectPlayer: function(event) {
        console.log('connecting player', event)
        this.$socket.emit('CONNECT_PLAYER')
      },
      disconnectPlayer: function(event) {
        console.log('disconnecting player', event)
        this.$socket.emit('DISCONNECT_PLAYER')
      }
    },
    computed:{
      canConnect: function() {
        return this.username !== this.user.username;
      }
    }
  }
</script>