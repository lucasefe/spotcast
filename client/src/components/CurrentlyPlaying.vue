<template>
<p>{{ currentSong }}</p>
</template>

<script>
  export default {
    sockets: {
      PLAYLIST_UPDATED: function({ currentSong }) {
        this.currentSong = currentSong;
      }
    },

    data: () => ({
      currentSong: 'sss'
    }),
  }
</script>
