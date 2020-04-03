<template>
  <div v-if="item">
    <p>{{ item.name }}</p>
    <p>{{ item.album.name}}</p>
    <p>{{ item.artists[0].name}}</p>

    <p>{{ progressMS }}</p>
  </div>
</template>

<script>
  export default {
    sockets: {
      PLAYER_UPDATED: function(socket_data) {
        this.item       = socket_data.item;
        this.progressMS = socket_data.progressMS
      }
    },

    data: () => ({
      item: '',
      progressMS: ''
    }),
  }
</script>
