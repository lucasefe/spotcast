<template>
  <div class="card">
    <div class="card-content">
      <div class="media">
        <div class="media-left">
          <figure class="image is-48x48">
            <img v-bind:src="player.albumCoverURL" class="is-128x128">
          </figure>
        </div>
        <div class="media-content">
          <p class="title is-4">{{player.trackName}}</p>
          <p class="subtitle is-6"> {{player.artistName}}</p>
        </div>
      </div>
      <div class="content">
        <b-progress :value="player.trackProgress" :type="type" size="is-small" format="percent"></b-progress>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: [ 'player' ],
    computed: {
      type: function() {
        return this.player.isPlaying ? 'is-success' : 'is-darkgrey';
      }
    }
  }
</script>