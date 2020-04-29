<template>
  <div v-if="player">
    <div class="table-container">
      <table class="table is-narrow">
        <tr v-for="member in members" :key="member.name">
          <td>
            {{ member.name }}
          </td>
          <td v-if="session.username === member.username">
            playing
          </td>
          <td v-else-if="member.isConnected">
            connected
          </td>
          <td v-else>
            no connected
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
  export default {
    sockets: {
      PLAYER_UPDATED: function({ player, session }) {
        this.player = player;
        this.session = session;
      },
      MEMBERS_UPDATED: function(socket_data) {
        this.members = socket_data.members;
      }
    },

    data: () => ({
      members: '',
      player: '',
      session: '',
      columns: [
        {
          field: 'name',
          label: '',
          width: '40'
        }
      ]
    }),
  }
</script>