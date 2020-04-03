<template>
  <div v-if="item">
    <p>{{ item.name }}</p>
    <p>{{ item.album.name}}</p>
    <p>{{ item.artists[0].name}}</p>

    <b-progress :value="progress()" type="is-success" size="is-small" format="percent"></b-progress>


  </div>
</template>

<script>
  export default {
    sockets: {
      PLAYER_UPDATED: function(socket_data) {
        console.debug({ socket_data })
        this.item       = socket_data.item;
        this.progressMS = socket_data.progressMS
      }
    },

    data: () => ({
      item: '',
      progressMS: ''
    }),

    methods: {
      progress: function() {
        const current = this.progressMS *100 / this.item.duration_ms
        return current;
      }
    }
  }
</script>

total 100
progress x

