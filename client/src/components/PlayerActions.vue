<template>
  <div v-if="player">
    <div v-if="canConnect">
      <div v-if="profile.isConnected">
        <button class="button is-outlined" v-on:click="disconnectPlayer">Disconnect your player</button>
      </div>
      <div v-else>
        <button class="button is-outlined" v-on:click="connectPlayer">Connect your player</button>
      </div>
    </div>
    <div v-if="!profile.canPlay">
      <p>
      Looks like you can't play.
      <br/>
      There can be a few reasons why.
      </p>
      <ul>
        <li>You need to have Spotify app open.</li>
        <li>If you are using the web version, you need to be playing something</li>
      </ul>
    </div>
  </div>
  <div v-else>
    No player found. Looks like {{ session.name }} is not playing any music at the moment :-(
  </div>
</template>

<script>
  export default {
    sockets: {
      PLAYER_UPDATED: function({ player, session }) {
        this.player = player;
        this.session = session;
      },
      SESSION_UPDATED: function({ profile }) {
        this.profile = profile;
      }
    },

    data: () => ({
      player: '',
      session: '',
      profile: ''
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
        return this.profile && this.profile.canPlay;
      }
    }
  }
</script>