<template>
  <div v-if="player">
    <Player v-bind:player="player"></Player>
    <b-table :data="members" :columns="columns"></b-table>

    <div v-if="canConnect">
      <div v-if="profile.isConnected">
        <button v-on:click="disconnectPlayer">Disconnect your player</button>
      </div>
      <div v-else>
        <button v-on:click="connectPlayer">Connect your player</button>
      </div>
    </div>
  </div>
  <div v-else>
    No player found. Looks like {{ session.name }} is not playing any music at the moment :-(
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
        this.profile = profile
      },
      PLAYER_UPDATED: function({ player, session}) {
        this.player = player;
        this.session = session;
      },
      MEMBERS_UPDATED: function(socket_data) {
        this.members = socket_data.members;
      }
    },

    data: () => ({
      player: '',
      session: '',
      members: '',
      profile: '',
      columns: [
        {
          field: 'name',
          label: '',
          width: '40'
        }
      ]
    }),

    methods: {
      connectPlayer: function() {
        this.$socket.emit('CONNECT_PLAYER')
      },
      disconnectPlayer: function() {
        this.$socket.emit('DISCONNECT_PLAYER')
      }
    },
    computed:{
      canConnect: function() {
        return this.profile.username !== this.session.username;
      }
    }
  }
</script>