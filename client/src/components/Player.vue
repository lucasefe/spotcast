<template>
  <div v-if="item">
    <div class="card">
      <div class="card-content">
        <div class="media">
          <div class="media-left">
            <figure class="image is-48x48">
              <img v-bind:src="albumCover().url" class="is-128x128">
            </figure>
          </div>
          <div class="media-content">
            <p class="title is-4"> {{ songName() }}</p>
            <p class="subtitle is-6"> {{ artistName() }}</p>
          </div>
        </div>
        <div class="content">
          <b-progress :value="progress()" type="is-success" size="is-small" format="percent"></b-progress>
        </div>
      </div>
    </div>
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
      progressMS: '',
    }),

    methods: {
      progress: function() {
        const current = this.progressMS *100 / this.item.duration_ms
        return current;
      },
      songName: function() {
        return this.item.name;
      },
      albumName: function() {
        return this.item.album.name;
      },
      artistName: function() {
        return this.item.artists.map(a => a.name).join(", ")
      },
      albumCover: function() {
        return this.item.album.images[0];
      }
    }
  }
</script>